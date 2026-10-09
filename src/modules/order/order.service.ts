import { ExtraIngredientEntity } from '@modules/extra-ingredient/extra-ingredient.entity';
import { CreateOrderResultDto, OrderResultPizzaDto } from '@modules/order/dto/create-order-result.dto';
import { CreateOrderRequestDto } from '@modules/order/dto/create-order.dto';
import { OrderPizzaDto } from '@modules/order/dto/order-pizza.dto';
import { PagedOrdersRequestDto } from '@modules/order/dto/paged-orders.dto';
import { PaymentDto } from '@modules/order/dto/payment.dto';
import { OrderFilterService } from '@modules/order/order-filters.service';
import {
  CHEESE_CRUST_PRICE,
  ORDER_BONUSES,
  OrderStatus,
  PaymentType,
  SAUSAGE_CRUST_PRICE,
} from '@modules/order/order.constants';
import { OrderEntity } from '@modules/order/order.entity';
import { OrderResponse } from '@modules/order/types/order-response';
import { PagedOrderResponse } from '@modules/order/types/paged-order-response';
import { PizzaEntity } from '@modules/pizza/pizza.entity';
import { UserEntity } from '@modules/user/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PizzaEntity)
    private readonly pizzaRepository: Repository<PizzaEntity>,
    @InjectRepository(ExtraIngredientEntity)
    private readonly extraIngredientRepository: Repository<ExtraIngredientEntity>,
    private readonly orderFilters: OrderFilterService,
  ) {}

  async findAll(query: PagedOrdersRequestDto): Promise<PagedOrderResponse> {
    return await this.orderFilters.getFilteredData(query);
  }

  async create(newOrder: CreateOrderRequestDto, userId?: number): Promise<OrderResponse> {
    const hasBothCrusts = newOrder.pizzas.some(
      (orderPizza) => orderPizza.cheeseStuffedCrust && orderPizza.sausageStuffedCrust,
    );

    if (hasBothCrusts) {
      throw new HttpException('Pizza cannot have both cheese and sausage stuffed crust', HttpStatus.BAD_REQUEST);
    }

    const pizzas = await this.buildOrderPizzas(newOrder.pizzas);
    const user = userId ? await this.userRepository.findOne({ where: { id: userId } }) : null;

    if (user) {
      user.bonuses += ORDER_BONUSES;
      await this.userRepository.save(user);
    }

    const order = Object.assign(new OrderEntity(), {
      ...newOrder,
      price: this.calculatePrice(pizzas),
      userId: user?.id ?? null,
    });

    return await this.orderRepository.save(order);
  }

  async findById(orderId: number): Promise<OrderResponse> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    return order;
  }

  async buildCreateOrderResult(orderId: number): Promise<CreateOrderResultDto> {
    const order = await this.findById(orderId);
    const pizzas = await this.buildOrderPizzas(order.pizzas);

    return { id: order.id, pizzas, price: order.price };
  }

  async payOrder(paymentDto: PaymentDto): Promise<void> {
    const { orderId, paymentType } = paymentDto;
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new HttpException('Payment failed. Order not found', HttpStatus.BAD_REQUEST);
    }

    if (order.status === OrderStatus.PAID) {
      throw new HttpException('Payment failed. Order already paid', HttpStatus.BAD_REQUEST);
    }

    Object.assign(order, { paymentType, status: OrderStatus.PAID });

    if (paymentType !== PaymentType.BONUS_PAYMENT) {
      await this.orderRepository.save(order);
      return;
    }

    const user = order.userId ? await this.userRepository.findOne({ where: { id: order.userId } }) : null;

    if (!user || user.bonuses < order.price) {
      throw new HttpException('Payment failed. Not enough bonuses', HttpStatus.BAD_REQUEST);
    }

    user.bonuses -= order.price;

    await this.orderRepository.manager.transaction(async (manager) => {
      await manager.save(user);
      await manager.save(order);
    });
  }

  private async buildOrderPizzas(orderPizzas: OrderPizzaDto[]): Promise<OrderResultPizzaDto[]> {
    const pizzaIds = orderPizzas.map((orderPizza) => orderPizza.pizzaId);
    const extraIngredientsIds = orderPizzas.flatMap((orderPizza) => orderPizza.extraIngredientsIds);

    const [pizzas, extraIngredients] = await Promise.all([
      this.pizzaRepository.findBy({ id: In(pizzaIds) }),
      this.extraIngredientRepository.findBy({ id: In(extraIngredientsIds) }),
    ]);

    return orderPizzas.map((orderPizza) => {
      const pizza = pizzas.find((pizzaEntity) => pizzaEntity.id === orderPizza.pizzaId);
      const hasAllExtraIngredients = orderPizza.extraIngredientsIds.every((ingredientId) =>
        extraIngredients.some((ingredient) => ingredient.id === ingredientId),
      );

      if (!pizza) {
        throw new HttpException(`Pizza ${orderPizza.pizzaId} not found`, HttpStatus.BAD_REQUEST);
      }

      if (!hasAllExtraIngredients) {
        throw new HttpException('Extra ingredient not found', HttpStatus.BAD_REQUEST);
      }

      return {
        pizza,
        extraIngredients: extraIngredients.filter((ingredient) =>
          orderPizza.extraIngredientsIds.includes(ingredient.id),
        ),
        count: orderPizza.count,
        cheeseStuffedCrust: orderPizza.cheeseStuffedCrust,
        sausageStuffedCrust: orderPizza.sausageStuffedCrust,
      };
    });
  }

  private calculatePrice(orderPizzas: OrderResultPizzaDto[]): number {
    return orderPizzas.reduce((total, orderPizza) => {
      const extraIngredientsPrice = orderPizza.extraIngredients.reduce((sum, ingredient) => sum + ingredient.price, 0);
      const cheeseCrustPrice = orderPizza.cheeseStuffedCrust ? CHEESE_CRUST_PRICE : 0;
      const sausageCrustPrice = orderPizza.sausageStuffedCrust ? SAUSAGE_CRUST_PRICE : 0;
      const pizzaPrice = orderPizza.pizza.price + extraIngredientsPrice + cheeseCrustPrice + sausageCrustPrice;

      return total + pizzaPrice * orderPizza.count;
    }, 0);
  }
}
