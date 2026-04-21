import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { subject } from '@casl/ability';
import { Todo, TodoDocument } from './schemas/todo.schema';

import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Action, AppAbility } from '../casl/casl.types';

@Injectable()
export class TodoService {
  constructor(
    @InjectModel(Todo.name) private todoModel: Model<TodoDocument>,
  ) {}

  async findAll(): Promise<TodoDocument[]> {
    return this.todoModel.find().sort({ created_at: -1 }).exec();
  }

  async findOne(id: string): Promise<TodoDocument> {
    const todo = await this.todoModel.findById(id).exec();

    if (!todo) {
      throw new NotFoundException(`Todo with id '${id}' not found`);
    }

    return todo;
  }

  async create(
    createTodoDto: CreateTodoDto,
    userId: string,
  ): Promise<TodoDocument> {
    const newTodo = new this.todoModel({
      ...createTodoDto,
      userId: new Types.ObjectId(userId),
    });

    return newTodo.save();
  }

  async update(
    id: string,
    updateTodoDto: UpdateTodoDto,
    ability: AppAbility,
  ): Promise<TodoDocument> {
    const todo = await this.todoModel.findById(id).exec();

    if (!todo) {
      throw new NotFoundException(`Todo with id '${id}' not found`);
    }

    const plainTodo = subject('Todo', {
      ...todo.toObject(),
      userId: todo.userId.toString(),
    } as any);

    if (!ability.can(Action.Update, plainTodo)) {
      throw new ForbiddenException(
        'You do not have permission to update this todo',
      );
    }

    return this.todoModel
      .findByIdAndUpdate(id, updateTodoDto, { new: true })
      .exec() as Promise<TodoDocument>;
  }

  async remove(id: string, ability: AppAbility): Promise<void> {
    const todo = await this.todoModel.findById(id).exec();

    if (!todo) {
      throw new NotFoundException(`Todo with id '${id}' not found`);
    }

    const plainTodo = subject('Todo', {
      ...todo.toObject(),
      userId: todo.userId.toString(),
    } as any);

    if (!ability.can(Action.Delete, plainTodo)) {
      throw new ForbiddenException(
        'You do not have permission to delete this todo',
      );
    }

    await this.todoModel.findByIdAndDelete(id).exec();
  }
}
