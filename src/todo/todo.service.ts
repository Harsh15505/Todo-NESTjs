import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Todo, TodoDocument } from './schemas/todo.schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
    constructor(@InjectModel(Todo.name) private todoModel: Model<TodoDocument>) {}

    async findAll(userId: string): Promise<TodoDocument[]> {
        return this.todoModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ created_at: -1 })
            .exec();
    }

    async findOne(id: string, userId: string): Promise<TodoDocument> {
        const todo = await this.todoModel
            .findOne({ _id: id, userId: new Types.ObjectId(userId) })
            .exec();

        if (!todo) {
            throw new NotFoundException(`Todo with id '${id}' not found`);
        }

        return todo;
    }

    async create(createTodoDto: CreateTodoDto, userId: string): Promise<TodoDocument> {
        const newTodo = new this.todoModel({
            ...createTodoDto,
            userId: new Types.ObjectId(userId),
        });

        return newTodo.save();
    }

    async update(id: string, updateTodoDto: UpdateTodoDto, userId: string): Promise<TodoDocument> {
        const updated = await this.todoModel
            .findOneAndUpdate(
                { _id: id, userId: new Types.ObjectId(userId) },
                updateTodoDto,
                { new: true },
            )
            .exec();

        if (!updated) {
            throw new NotFoundException(`Todo with id '${id}' not found`);
        }

        return updated;
    }

    async remove(id: string, userId: string): Promise<void> {
        const result = await this.todoModel
            .findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) })
            .exec();

        if (!result) {
            throw new NotFoundException(`Todo with id '${id}' not found`);
    }

        return;
    }
}
