export class AppError extends Error {
  constructor(public readonly code: string, public readonly httpStatus: number, message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) { super('VALIDATION_ERROR', 400, message); }
}

export class NotFoundError extends AppError {
  constructor() { super('NOT_FOUND', 404, 'Rota não encontrada.'); }
}

export class DatabaseError extends AppError {
  constructor() {
    super('DATABASE_ERROR', 500, 'Não foi possível verificar a conexão com o banco de dados.');
  }
}
