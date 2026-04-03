import { Injectable } from '@nestjs/common';

export interface Todo {
    id: number;
    title: string;
    description?: string;
    isDone: boolean;
    createdAt: Date;
}

@Injectable()
export class TodoService {
    private todos: Todo[] = [];
    private nextId = 1;

    findAll(): Todo[] {
        return this.todos;
    }

    findOne(id: number): Todo | undefined {
        return this.todos.find((todo) => todo.id === id);
    }

    create(data: { title: string; description?: string }): Todo {
        const newTodo: Todo = {
            id: this.nextId++,
            title: data.title,
            description: data.description,
            isDone: false,
            createdAt: new Date(),
        };
        this.todos.push(newTodo);
        return newTodo;
    }

    update(id: number, data: Partial<Todo>): Todo | null {
        const todo = this.findOne(id);
        if (!todo) return null;

        Object.assign(todo, data);
        return todo;
    }

    remove(id: number): boolean {
        const index = this.todos.findIndex((todo) => todo.id === id);
        if (index === -1) return false;

        this.todos.splice(index, 1);
        return true;
    }
}
