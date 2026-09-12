import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { AuthenticatedCustomer } from '../auth/types/authenticated-customer.type';
import type { DatabaseExecutor } from '../db/db.module';
import { ProductsService } from '../products/products.service';
import type {
  AddCartItemDto,
  CartSessionDto,
  UpdateCartItemDto,
} from './dto/cart.dto';
import { CartsRepository } from './carts.repository';

@Injectable()
export class CartsService {
  constructor(
    private readonly cartsRepository: CartsRepository,
    private readonly productsService: ProductsService,
  ) {}

  async createSession(payload: CartSessionDto) {
    if (payload.cartToken) {
      const [existingCart] = await this.cartsRepository.findBySessionToken(
        payload.cartToken,
      );

      if (existingCart && !existingCart.customerId) {
        return {
          cartToken: existingCart.sessionToken,
          cart: await this.formatCart(existingCart.id),
        };
      }
    }

    const cartToken = this.createCartToken();
    const [cart] = await this.cartsRepository.create({
      sessionToken: cartToken,
    });

    return {
      cartToken,
      cart: await this.formatCart(cart.id),
    };
  }

  async getCart(
    customer: AuthenticatedCustomer | undefined,
    cartToken?: string,
  ) {
    const cart = await this.resolveCart(customer, cartToken, true);

    if (!cart) {
      return null;
    }

    return this.formatCart(cart.id);
  }

  async getCheckoutCart(
    customer: AuthenticatedCustomer | undefined,
    cartToken: string | undefined,
    executor: DatabaseExecutor,
  ) {
    const cart = await this.resolveCart(customer, cartToken, false, executor);

    if (!cart) {
      throw new BadRequestException('Cart session is required');
    }

    return this.formatCart(cart.id, executor);
  }

  async clearCartById(cartId: string, executor: DatabaseExecutor) {
    await this.cartsRepository.clearItems(cartId, executor);

    return { id: cartId };
  }

  async addItem(
    customer: AuthenticatedCustomer | undefined,
    cartToken: string | undefined,
    payload: AddCartItemDto,
  ) {
    const cart = await this.resolveCart(customer, cartToken, true);

    if (!cart) {
      throw new BadRequestException('Cart session is required');
    }

    const [existingItem] = await this.cartsRepository.findItemByCartAndVariant(
      cart.id,
      payload.variantId,
    );
    const nextQuantity = (existingItem?.quantity ?? 0) + payload.quantity;

    await this.productsService.ensureVariantQuantityIsAvailable(
      payload.variantId,
      nextQuantity,
    );

    if (existingItem) {
      await this.cartsRepository.updateItemQuantity(
        existingItem.id,
        nextQuantity,
      );
    } else {
      await this.cartsRepository.createItem({
        cartId: cart.id,
        variantId: payload.variantId,
        quantity: payload.quantity,
      });
    }

    await this.cartsRepository.updateCartTimestamp(cart.id);

    return this.formatCart(cart.id);
  }

  async updateItem(
    customer: AuthenticatedCustomer | undefined,
    cartToken: string | undefined,
    itemId: string,
    payload: UpdateCartItemDto,
  ) {
    const cart = await this.resolveRequiredCart(customer, cartToken);
    const item = await this.ensureCartItemBelongsToCart(itemId, cart.id);

    if (!item.variantId) {
      throw new BadRequestException('Cart item is missing a product variant');
    }

    await this.productsService.ensureVariantQuantityIsAvailable(
      item.variantId,
      payload.quantity,
    );
    await this.cartsRepository.updateItemQuantity(itemId, payload.quantity);
    await this.cartsRepository.updateCartTimestamp(cart.id);

    return this.formatCart(cart.id);
  }

  async deleteItem(
    customer: AuthenticatedCustomer | undefined,
    cartToken: string | undefined,
    itemId: string,
  ) {
    const cart = await this.resolveRequiredCart(customer, cartToken);
    await this.ensureCartItemBelongsToCart(itemId, cart.id);
    await this.cartsRepository.deleteItem(itemId);
    await this.cartsRepository.updateCartTimestamp(cart.id);

    return this.formatCart(cart.id);
  }

  async clearCart(
    customer: AuthenticatedCustomer | undefined,
    cartToken: string | undefined,
  ) {
    const cart = await this.resolveRequiredCart(customer, cartToken);
    await this.cartsRepository.clearItems(cart.id);
    await this.cartsRepository.updateCartTimestamp(cart.id);

    return this.formatCart(cart.id);
  }

  async mergeGuestCart(customer: AuthenticatedCustomer, cartToken: string) {
    if (!cartToken) {
      throw new BadRequestException('Cart token is required');
    }

    return this.cartsRepository.transaction(async (transaction) => {
      await this.cartsRepository.lockCustomerMerge(customer.id, transaction);
      const customerCart = await this.resolveCustomerCart(
        customer.id,
        true,
        transaction,
      );
      const [guestCart] = await this.cartsRepository.lockBySessionToken(
        cartToken,
        transaction,
      );

      if (!guestCart || guestCart.customerId) {
        return this.formatCart(customerCart.id, transaction);
      }

      const guestItems = await this.cartsRepository.findItemsByCartId(
        guestCart.id,
        transaction,
      );

      for (const guestItem of guestItems) {
        if (!guestItem.variantId) continue;
        const [customerItem] =
          await this.cartsRepository.findItemByCartAndVariant(
            customerCart.id,
            guestItem.variantId,
            transaction,
          );
        const nextQuantity =
          (customerItem?.quantity ?? 0) + (guestItem.quantity ?? 0);
        await this.productsService.ensureVariantQuantityIsAvailable(
          guestItem.variantId,
          nextQuantity,
          transaction,
        );
        if (customerItem) {
          await this.cartsRepository.updateItemQuantity(
            customerItem.id,
            nextQuantity,
            transaction,
          );
        } else {
          await this.cartsRepository.createItem(
            {
              cartId: customerCart.id,
              variantId: guestItem.variantId,
              quantity: guestItem.quantity ?? 0,
            },
            transaction,
          );
        }
      }

      await this.cartsRepository.clearItems(guestCart.id, transaction);
      await this.cartsRepository.deleteCart(guestCart.id, transaction);
      await this.cartsRepository.updateCartTimestamp(
        customerCart.id,
        transaction,
      );
      return this.formatCart(customerCart.id, transaction);
    });
  }

  private async resolveCart(
    customer: AuthenticatedCustomer | undefined,
    cartToken: string | undefined,
    createIfMissing: boolean,
    executor?: DatabaseExecutor,
  ) {
    if (customer) {
      return this.resolveCustomerCart(customer.id, createIfMissing, executor);
    }

    if (!cartToken) {
      return null;
    }

    const [cart] = await this.cartsRepository.findBySessionToken(
      cartToken,
      executor,
    );

    if (!cart) {
      if (createIfMissing) {
        const [createdCart] = await this.cartsRepository.create(
          { sessionToken: cartToken },
          executor,
        );

        return createdCart;
      }

      throw new NotFoundException('Cart not found');
    }

    if (cart.customerId) {
      throw new BadRequestException('Cart token is no longer a guest cart');
    }

    return cart;
  }

  private async resolveRequiredCart(
    customer: AuthenticatedCustomer | undefined,
    cartToken: string | undefined,
  ) {
    const cart = await this.resolveCart(customer, cartToken, false);

    if (!cart) {
      throw new BadRequestException('Cart session is required');
    }

    return cart;
  }

  private async resolveCustomerCart(
    customerId: string,
    createIfMissing: boolean,
    executor?: DatabaseExecutor,
  ) {
    const [cart] = await this.cartsRepository.findByCustomerId(
      customerId,
      executor,
    );

    if (cart) {
      return cart;
    }

    if (!createIfMissing) {
      throw new NotFoundException('Cart not found');
    }

    const [createdCart] = await this.cartsRepository.create(
      { customerId },
      executor,
    );

    return createdCart;
  }

  private async ensureCartItemBelongsToCart(itemId: string, cartId: string) {
    const [item] = await this.cartsRepository.findItemById(itemId);

    if (!item || item.cartId !== cartId) {
      throw new NotFoundException('Cart item not found');
    }

    return item;
  }

  private async formatCart(cartId: string, executor?: DatabaseExecutor) {
    const [cart] = await this.cartsRepository.findById(cartId, executor);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const items = await this.cartsRepository.findItemsByCartId(
      cart.id,
      executor,
    );
    const subtotal = items.reduce((sum, item) => {
      const unitPrice = item.discountedPrice ?? item.sellerPrice ?? '0';

      return sum + Number(unitPrice) * (item.quantity ?? 0);
    }, 0);
    const publicItems = items.map(
      ({ stockQuantity, reservedQuantity, ...item }) => ({
        ...item,
        isAvailable:
          item.productStatus === 'active' &&
          item.isActive === true &&
          (stockQuantity ?? 0) - (reservedQuantity ?? 0) >=
            (item.quantity ?? 0),
      }),
    );

    return {
      id: cart.id,
      customerId: cart.customerId,
      sessionToken: cart.sessionToken,
      items: publicItems,
      subtotal: subtotal.toFixed(2),
      totalQuantity: items.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  private createCartToken() {
    return randomBytes(32).toString('hex');
  }
}
