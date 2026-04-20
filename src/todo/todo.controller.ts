import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { PoliciesGuard } from '../auth/guards/policies.guard';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { Action } from '../casl/casl.types';

@UseGuards(PoliciesGuard)
@Controller('todo')
export class TodoController {
  constructor(
    private readonly todoService: TodoService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'Todo'))
  findAll() {
    return this.todoService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Todo'))
  findOne(@Param('id') id: string) {
    return this.todoService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Todo'))
  create(@Body() createTodoDto: CreateTodoDto, @CurrentUser() user: JwtUser) {
    return this.todoService.create(createTodoDto, user.userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @CurrentUser() user: JwtUser,
  ) {
    const ability = this.caslAbilityFactory.defineAbilityFor(user);
    return this.todoService.update(id, updateTodoDto, ability);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const ability = this.caslAbilityFactory.defineAbilityFor(user);
    return this.todoService.remove(id, ability);
  }
}