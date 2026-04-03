import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { TodoService } from './todo.service';

@Controller('todo')
export class TodoController {
    constructor(private readonly todoService: TodoService) { }

    @Get()
    findAll() {
        return this.todoService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        const todo = this.todoService.findOne(+id)
        if (!todo) {
            throw new NotFoundException(`Task with ${id} id not found`);
        }

        return todo;
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() body: { title: string, description?: string }) {
        return this.todoService.create(body);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: { title?: string; description?: string; isDone?: boolean }) {
        const updated = this.todoService.update(+id, body);
        if (!updated) {
            throw new NotFoundException(`Task with ${id} not found`);
        }

        return updated;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        const deleted = this.todoService.remove(+id);

        if (!deleted) {
            throw new NotFoundException(`Todo with id ${id} not found`);
        }
    }
}