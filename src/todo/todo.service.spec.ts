import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TodoService } from './todo.service';
import { Todo } from './schemas/todo.schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

const mockUserId = new Types.ObjectId().toHexString();
const mockTodoId = new Types.ObjectId().toHexString();

const mockTodo = {
  _id: mockTodoId,
  title: 'Learn Unit Testing',
  description: 'Write tests for Todo app',
  completed: false,
  userId: new Types.ObjectId(mockUserId),
  created_at: new Date(),
  updated_at: new Date(),
};

const mockTodoModel = {
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockTodo]),
    }),
  }),
  findOne: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(mockTodo),
  }),
  findOneAndUpdate: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue({ ...mockTodo, completed: true }),
  }),
  findOneAndDelete: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(mockTodo),
  }),
};

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        {
          provide: getModelToken(Todo.name),
          useValue: mockTodoModel,
        },
      ],
    }).compile();

    service = module.get<TodoService>(TodoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of todos for the user', async () => {
      const result = await service.findAll(mockUserId);
      expect(result).toEqual([mockTodo]);
      expect(mockTodoModel.find).toHaveBeenCalledWith({
        userId: new Types.ObjectId(mockUserId),
      });
      expect(mockTodoModel.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when user has no todos', async () => {
      mockTodoModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });
      const result = await service.findAll(mockUserId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a todo when found', async () => {
      const result = await service.findOne(mockTodoId, mockUserId);
      expect(result).toEqual(mockTodo);
      expect(mockTodoModel.findOne).toHaveBeenCalledWith({
        _id: mockTodoId,
        userId: new Types.ObjectId(mockUserId),
      });
    });

    it('should throw NotFoundException when todo is not found', async () => {
      mockTodoModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(
        service.findOne('nonexistent-id', mockUserId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should NOT return another user\'s todo (security test)', async () => {
      mockTodoModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      const differentUserId = new Types.ObjectId().toHexString();
      await expect(
        service.findOne(mockTodoId, differentUserId)
      ).rejects.toThrow(NotFoundException);
      expect(mockTodoModel.findOne).toHaveBeenCalledWith({
        _id: mockTodoId,
        userId: new Types.ObjectId(differentUserId),
      });
    });
  });

  describe('create', () => {
    it('should create and save a new todo', async () => {
      const createDto: CreateTodoDto = {
        title: 'Buy groceries',
        description: 'Milk and eggs',
      };
      const saveMock = jest.fn().mockResolvedValue(mockTodo);
      (service as any).todoModel = jest.fn().mockImplementation(() => ({
        save: saveMock,
      }));
      const result = await service.create(createDto, mockUserId);
      expect(result).toEqual(mockTodo);
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect((service as any).todoModel).toHaveBeenCalledWith({
        ...createDto,
        userId: new Types.ObjectId(mockUserId),
      });
    });

    it('should create a todo without description', async () => {
      const createDto: CreateTodoDto = {
        title: 'Minimal todo',
      };
      const saveMock = jest.fn().mockResolvedValue({ ...mockTodo, description: undefined });
      (service as any).todoModel = jest.fn().mockImplementation(() => ({ save: saveMock }));
      const result = await service.create(createDto, mockUserId);
      expect(result.title).toBe(mockTodo.title);
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return the updated todo', async () => {
      const updateDto: UpdateTodoDto = { completed: true };
      const updatedMock = { ...mockTodo, completed: true };
      mockTodoModel.findOneAndUpdate.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(updatedMock),
      });
      const result = await service.update(mockTodoId, updateDto, mockUserId);
      expect(result).toEqual(updatedMock);
      expect(result.completed).toBe(true);
      expect(mockTodoModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockTodoId, userId: new Types.ObjectId(mockUserId) },
        updateDto,
        { new: true },
      );
    });

    it('should throw NotFoundException when todo to update is not found', async () => {
      mockTodoModel.findOneAndUpdate.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      const updateDto: UpdateTodoDto = { completed: true };
      await expect(
        service.update('nonexistent-id', updateDto, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should not update another user\'s todo', async () => {
      mockTodoModel.findOneAndUpdate.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      const differentUser = new Types.ObjectId().toHexString();
      const updateDto: UpdateTodoDto = { title: 'Hacked title' };
      await expect(
        service.update(mockTodoId, updateDto, differentUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a todo and return void', async () => {
      mockTodoModel.findOneAndDelete.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockTodo),
      });
      await expect(
        service.remove(mockTodoId, mockUserId)
      ).resolves.toBeUndefined();
      expect(mockTodoModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: mockTodoId,
        userId: new Types.ObjectId(mockUserId),
      });
    });

    it('should throw NotFoundException when todo to delete is not found', async () => {
      mockTodoModel.findOneAndDelete.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(
        service.remove('ghost-id', mockUserId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should not delete another user\'s todo', async () => {
      mockTodoModel.findOneAndDelete.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      const differentUser = new Types.ObjectId().toHexString();
      await expect(
        service.remove(mockTodoId, differentUser)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
