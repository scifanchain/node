import { ulid, monotonicFactory } from 'ulid';

/**
 * ULID 工具类
 * 提供去中心化友好的唯一标识符生成
 */
export class ULIDGenerator {
    private monotonicUlid: () => string;

    constructor() {
        // 创建单调递增的ULID生成器，确保同一毫秒内的ULID有序
        this.monotonicUlid = monotonicFactory();
    }

    /**
     * 生成标准ULID
     * @returns 26字符的ULID
     */
    generate(): string {
        return ulid();
    }

    /**
     * 生成单调递增ULID（推荐用于数据库主键）
     * @returns 26字符的单调ULID
     */
    generateMonotonic(): string {
        return this.monotonicUlid();
    }

    /**
     * 从时间戳生成ULID
     * @param timestamp - Unix时间戳（毫秒）
     * @returns ULID
     */
    generateFromTime(timestamp: number): string {
        return ulid(timestamp);
    }

    /**
     * 解析ULID获取时间戳
     * @param id - ULID字符串
     * @returns Unix时间戳（毫秒）
     */
    getTimestamp(id: string): number {
        if (!this.isValid(id)) {
            throw new Error('无效的ULID格式');
        }
        
        // ULID前10个字符是时间戳部分
        const timeStr = id.substring(0, 10);
        
        // Crockford Base32解码
        const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        let timestamp = 0;
        
        for (let i = 0; i < timeStr.length; i++) {
            const char = timeStr[i];
            const value = alphabet.indexOf(char);
            if (value === -1) {
                throw new Error('无效的ULID字符: ' + char);
            }
            timestamp = timestamp * 32 + value;
        }
        
        return timestamp;
    }

    /**
     * 获取ULID的随机部分
     * @param id - ULID字符串
     * @returns 随机部分（16字符）
     */
    getRandomPart(id: string): string {
        if (!this.isValid(id)) {
            throw new Error('无效的ULID格式');
        }
        return id.substring(10);
    }

    /**
     * 验证ULID格式
     * @param id - 待验证的字符串
     * @returns 是否有效
     */
    isValid(id: string): boolean {
        if (typeof id !== 'string') return false;
        if (id.length !== 26) return false;
        
        // 检查字符是否都在Crockford Base32字符集中
        const validChars = /^[0-9A-HJKMNP-TV-Z]{26}$/;
        return validChars.test(id);
    }

    /**
     * 比较两个ULID的时间先后
     * @param ulid1 - 第一个ULID
     * @param ulid2 - 第二个ULID
     * @returns -1: ulid1早于ulid2, 0: 相同时间, 1: ulid1晚于ulid2
     */
    compareTime(ulid1: string, ulid2: string): number {
        const time1 = this.getTimestamp(ulid1);
        const time2 = this.getTimestamp(ulid2);
        
        if (time1 < time2) return -1;
        if (time1 > time2) return 1;
        return 0;
    }

    /**
     * 格式化ULID显示（添加分隔符便于阅读）
     * @param id - ULID字符串
     * @returns 格式化的ULID
     */
    format(id: string): string {
        if (!this.isValid(id)) {
            return id; // 无效ULID直接返回
        }
        
        // 格式: 01F8MECHZX-3TB58Y2FE12H
        return `${id.substring(0, 10)}-${id.substring(10)}`;
    }

    /**
     * 移除ULID格式化（去除分隔符）
     * @param formattedId - 格式化的ULID
     * @returns 标准ULID
     */
    unformat(formattedId: string): string {
        return formattedId.replace(/-/g, '');
    }

    /**
     * 获取ULID的可读时间
     * @param id - ULID字符串
     * @returns 格式化的时间字符串
     */
    getReadableTime(id: string): string {
        try {
            const timestamp = this.getTimestamp(id);
            return new Date(timestamp).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return '无效时间';
        }
    }

    /**
     * 生成指定时间范围内的ULID集合（用于测试或批量生成）
     * @param startTime - 开始时间戳
     * @param endTime - 结束时间戳
     * @param count - 生成数量
     * @returns ULID数组
     */
    generateBatch(startTime: number, endTime: number, count: number = 10): string[] {
        const ulids: string[] = [];
        const timeSpan = endTime - startTime;
        
        for (let i = 0; i < count; i++) {
            const randomTime = startTime + Math.floor(Math.random() * timeSpan);
            ulids.push(this.generateFromTime(randomTime));
        }
        
        // 按时间排序
        return ulids.sort();
    }
}

// 创建单例实例
const ulidGenerator = new ULIDGenerator();

export default ulidGenerator;

// 便捷方法导出
export const generate = (): string => ulidGenerator.generate();
export const generateMonotonic = (): string => ulidGenerator.generateMonotonic();
export const generateFromTime = (timestamp: number): string => ulidGenerator.generateFromTime(timestamp);
export const getTimestamp = (id: string): number => ulidGenerator.getTimestamp(id);
export const isValid = (id: string): boolean => ulidGenerator.isValid(id);
export const format = (id: string): string => ulidGenerator.format(id);
export const getReadableTime = (id: string): string => ulidGenerator.getReadableTime(id);
