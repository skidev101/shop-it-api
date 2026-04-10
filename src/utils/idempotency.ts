import { redisConnection } from "../config/redis";

class IdempotencyService {
  private ttl = 60 * 5; // 5 minutes

  async startISession(key: string) {
    const result = await redisConnection.set(
      key,
      JSON.stringify({ status: "processing", timeStamp: Date.now() }),
      "EX",
      this.ttl,
      "NX",
    );
    console.log("redis start ops result:", result);

    return result === "OK"; // true = new request
  }

  async getISession(key: string) {
    const data = await redisConnection.get(key);
    return data ? JSON.parse(data) : null;
  }

  async completeISession(key: string, orderId: string) {
    await redisConnection.set(
      key,
      JSON.stringify({
        status: "completed",
        orderId,
        timeStamp: Date.now(),
      }),
      "EX",
      this.ttl,
    );
  }

  async cleanupISession(key: string) {
    await redisConnection.del(key);
  }
}

const idempotencyService = new IdempotencyService();
export default idempotencyService;
