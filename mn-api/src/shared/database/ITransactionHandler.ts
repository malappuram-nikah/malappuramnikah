export interface ITransactionHandler {
  runInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
