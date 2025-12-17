import { ExtraIngredientEntity } from '@app/extra-ingredient/extra.ingredient.entity';
import { CreateOrderRequestDto, CreateOrderResultDto, PagedOrdersRequestDto, PaymentDto } from '@app/order/dto';
import { OrderEntity } from '@app/order/order.entity';
import { OrderFilterService } from '@app/order/order.filters.service';
import { OrderResponse } from '@app/order/types/order.response';
import { OrderResult } from '@app/order/types/order.result';
import { PagedOrderResponse } from '@app/order/types/pages.order.response';
import { PizzaEntity } from '@app/pizza/pizza.entity';
import { UserEntity } from '@app/user/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { OrderStatus } from './constants/index';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly orderFilters: OrderFilterService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: PagedOrdersRequestDto): Promise<PagedOrderResponse> {
    const response = await this.orderFilters.getFilteredData(query);

    return response;
  }

  async create(newOrder: CreateOrderRequestDto, userId?: number): Promise<OrderResponse> {
    let user: UserEntity | null = null;
    const order = Object.assign(new OrderEntity(), newOrder);

    if (userId) {
      user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.bonuses += 100;
        await this.userRepository.save(user);
      }
    }

    order.userId = user?.id ?? null;
    order.user = user ?? null;
    const orderResponse = await this.orderRepository.save(order, { data: { user: false } });

    return orderResponse;
  }

  async findById(userId: number): Promise<OrderResponse | null> {
    const order = await this.orderRepository.findOne({ where: { id: userId } });

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    return order;
  }

  async buildCreateOrderResult(orderId: number): Promise<CreateOrderResultDto> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    const pizzaIds: number[] = order.pizzas.map((pizza) => pizza.pizzaId);
    const extraIngredientsIds = order.pizzas.flatMap((pizza) => pizza.extraIngredientsIds.map((id) => id));

    const pizzaRepository = this.dataSource.getRepository(PizzaEntity);
    const ingredientRepository = this.dataSource.getRepository(ExtraIngredientEntity);

    const [pizzaEntities, pizzaExtraIngredients] = await Promise.all([
      pizzaRepository.findBy({ id: In(pizzaIds) }),
      ingredientRepository.findBy({ id: In(extraIngredientsIds) }),
    ]);

    const result: OrderResult = {
      id: order.id,
      pizzas: [],
      price: 0,
    };

    result.pizzas = pizzaEntities
      .map((pizza) => {
        const resultPizza = order.pizzas.find((p) => p.pizzaId === pizza.id);
        const extraIngredients = pizzaExtraIngredients.filter((ingredient) =>
          resultPizza.extraIngredientsIds.includes(ingredient.id),
        );

        if (resultPizza) {
          return {
            pizza,
            extraIngredients,
            count: resultPizza.count,
            cheeseStuffedCrust: resultPizza.cheeseStuffedCrust,
            sausageStuffedCrust: resultPizza.sausageStuffedCrust,
          };
        }
        return null;
      })
      .filter(Boolean);

    result.price = result.pizzas.reduce((acc, pizza) => {
      acc = pizza.cheeseStuffedCrust ? acc + 50 : acc;
      acc = pizza.sausageStuffedCrust ? acc + 70 : acc;

      acc += pizza.extraIngredients.reduce(
        (ingredientAcc, ingredient) => ingredientAcc + ingredient.price * pizza.count,
        0,
      );

      return acc + pizza.pizza.price * pizza.count;
    }, 0);

    return result;
  }

  async payOrder(paymentDto: PaymentDto): Promise<void> {
    const { orderId, paymentType } = paymentDto;
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new HttpException('Payment failed. Order not found', HttpStatus.BAD_REQUEST);
    }

    Object.assign(order, { paymentType, status: OrderStatus.PAID });

    await this.orderRepository.save(order);
  }
}
