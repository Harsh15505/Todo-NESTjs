import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('todo')
export class TodoController {
    constructor(private readonly todoService: TodoService) { }

    @Get()
    findAll(@CurrentUser() user: JwtUser) {
        return this.todoService.findAll(user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
        return this.todoService.findOne(id, user.userId);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createTodoDto: CreateTodoDto, @CurrentUser() user: JwtUser) {
        return this.todoService.create(createTodoDto, user.userId);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto, @CurrentUser() user: JwtUser) {
        return this.todoService.update(id, updateTodoDto, user.userId);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
        return this.todoService.remove(id, user.userId);
    }
}