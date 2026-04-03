import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Todo, TodoDocument } from './schemas/todo.schema';

// export interface Todo {
//     id: number;
//     title: string;
//     description?: string;
//     isDone: boolean;
//     createdAt: Date;
// }

@Injectable()
export class TodoService {
    
    constructor(@InjectModel(Todo.name) private todoModel: Model<TodoDocument>) {}

    async findAll(): Promise<TodoDocument[]> {
        return this.todoModel.find().exec();
    }

    async findOne(id: string): Promise<TodoDocument> {
        const todo = await this.todoModel.findById(id).exec();

        if(!todo){
            throw new NotFoundException(`Todo with id '${id}' not found`);
        }

        return todo;
    }

    async create(data: { title: string; description?: string }): Promise<TodoDocument> {
        const newTodo = new this.todoModel(data);
        return newTodo.save();
    }

    async update(id: string, data: { title?:string; description?: string; isDone?: boolean; } ): Promise<TodoDocument> {
        const updated = await this.todoModel.findByIdAndUpdate(id, data, { new:true }).exec();
        
        if(!updated){
            throw new NotFoundException(`Todo with id '${id}' not found`);
        }
        
        return updated;
    }

    async remove(id: string): Promise<void> {
        const result = await this.todoModel.findByIdAndDelete(id).exec();
        
        if(!result){
            throw new NotFoundException(`Todo with id '${id}' not found`);
        }

    }
}
