import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtUser } from '../auth/decorators/current-user.decorator';

const mockUserId = new Types.ObjectId().toHexString();
const mockTodoId = new Types.ObjectId().toHexString();

const mockJwtUser: JwtUser = {
  userId: mockUserId,
  email: 'test@example.com',
  role: 'user',
};

const mockTodo = {
  _id: mockTodoId,
  title: 'Learn Testing',
  description: 'Write unit tests',
  completed: false,
  userId: new Types.ObjectId(mockUserId),
};

const mockTodoService = {
  findAll: jest.fn().mockResolvedValue([mockTodo]),
  findOne: jest.fn().mockResolvedValue(mockTodo),
  create: jest.fn().mockResolvedValue(mockTodo),
  update: jest.fn().mockResolvedValue({ ...mockTodo, completed: true }),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe('TodoController', () => {
  let controller: TodoController;
  let service: TodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [
        {
          provide: TodoService,
          useValue: mockTodoService,
        },
      ],
    }).compile();

    controller = module.get<TodoController>(TodoController);
    service = module.get<TodoService>(TodoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with userId and return todos', async () => {
      const result = await controller.findAll(mockJwtUser);
      expect(result).toEqual([mockTodo]);
      expect(service.findAll).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id and userId', async () => {
      const result = await controller.findOne(mockTodoId, mockJwtUser);
      expect(result).toEqual(mockTodo);
      expect(service.findOne).toHaveBeenCalledWith(mockTodoId, mockUserId);
    });

    it('should propagate NotFoundException from the service', async () => {
      (service.findOne as jest.Mock).mockRejectedValueOnce(
        new NotFoundException(`Todo with id 'bad-id' not found`)
      );
      await expect(
        controller.findOne('bad-id', mockJwtUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should call service.create with DTO and userId', async () => {
      const dto: CreateTodoDto = {
        title: 'New Todo',
        description: 'From test',
      };
      const result = await controller.create(dto, mockJwtUser);
      expect(result).toEqual(mockTodo);
      expect(service.create).toHaveBeenCalledWith(dto, mockUserId);
    });
  });

  describe('update', () => {
    it('should call service.update with id, DTO, and userId', async () => {
      const dto: UpdateTodoDto = { completed: true };
      const result = await controller.update(mockTodoId, dto, mockJwtUser);
      expect(result).toEqual({ ...mockTodo, completed: true });
      expect(service.update).toHaveBeenCalledWith(mockTodoId, dto, mockUserId);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id and userId', async () => {
      const result = await controller.remove(mockTodoId, mockJwtUser);
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(mockTodoId, mockUserId);
    });
  });
});
