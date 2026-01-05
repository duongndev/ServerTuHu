import { jest } from '@jest/globals';

// Mock axios before import
jest.unstable_mockModule('axios', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn()
  }
}));

// Import modules dynamically after mocking
const { default: axios } = await import('axios');
const { default: ZaloPayService } = await import('../../src/service/zalopay.service.js');
const { zalopayConfig } = await import('../../src/config/zalopay.config.js');
const crypto = (await import('crypto')).default; // crypto is a built-in module, might need handling or just import normally

describe('ZaloPayService', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentRequest', () => {
    it('should create payment request successfully', async () => {
      const mockOrder = {
        _id: 'order123',
        user_id: 'user123',
        total_price: 100000,
        items: [
          { product_id: 'p1', name: 'Product 1', price: 50000, quantity: 2 }
        ],
        redirect_url: 'myapp://callback'
      };

      const mockResponse = {
        data: {
          return_code: 1,
          return_message: 'Success',
          sub_return_code: 1,
          sub_return_message: 'Success',
          zp_trans_token: 'token123',
          order_url: 'https://zalopay.vn/order',
          order_token: 'token123'
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await ZaloPayService.createPaymentRequest(mockOrder);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        zalopayConfig.endpoint,
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            app_id: zalopayConfig.app_id,
            amount: mockOrder.total_price,
            app_user: mockOrder.user_id,
          })
        })
      );
      expect(result).toEqual(expect.objectContaining({
        return_code: 1,
        zp_trans_token: 'token123',
        app_trans_id: expect.any(String)
      }));
    });

    it('should throw error when axios fails', async () => {
      const mockOrder = {
        _id: 'order123',
        user_id: 'user123',
        total_price: 100000,
        items: []
      };

      axios.post.mockRejectedValue(new Error('Network Error'));

      await expect(ZaloPayService.createPaymentRequest(mockOrder)).rejects.toThrow('Network Error');
    });
  });

  describe('verifyCallback', () => {
    it('should return true for valid mac', () => {
      const dataStr = '{"amount":100000}';
      const mac = crypto
        .createHmac('sha256', zalopayConfig.key2)
        .update(dataStr)
        .digest('hex');

      const isValid = ZaloPayService.verifyCallback(dataStr, mac);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid mac', () => {
      const dataStr = '{"amount":100000}';
      const mac = 'invalid_mac';

      const isValid = ZaloPayService.verifyCallback(dataStr, mac);
      expect(isValid).toBe(false);
    });
  });

  describe('checkOrderStatus', () => {
    it('should check order status successfully', async () => {
      const app_trans_id = '230101_123456';
      const mockResponse = {
        data: {
          return_code: 1,
          return_message: 'Success',
          is_processing: false,
          amount: 100000,
          zp_trans_id: 123456
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await ZaloPayService.checkOrderStatus(app_trans_id);

      expect(axios.post).toHaveBeenCalledWith(
        zalopayConfig.query_endpoint,
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            app_id: zalopayConfig.app_id,
            app_trans_id: app_trans_id
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});
