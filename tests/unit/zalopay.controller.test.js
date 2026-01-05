import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/service/zalopay.service.js', () => ({
  default: {
    verifyCallback: jest.fn(),
    createPaymentRequest: jest.fn()
  }
}));

jest.unstable_mockModule('../../src/models/order.model.js', () => ({
  default: {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));

const { default: zaloPayController } = await import('../../src/controllers/zalopay.controller.js');
const { default: ZaloPayService } = await import('../../src/service/zalopay.service.js');
const { default: orderModel } = await import('../../src/models/order.model.js');

describe('ZaloPayController', () => {
  let req, res;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    req = {
      body: {
        data: '{"app_trans_id": "230101_123456"}',
        mac: 'some_mac_string'
      }
    };
    res = {
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('callback', () => {
    it('should return return_code -1 if mac is invalid', async () => {
      ZaloPayService.verifyCallback.mockReturnValue(false);

      await zaloPayController.callback(req, res);

      expect(res.json).toHaveBeenCalledWith({
        return_code: -1,
        return_message: 'mac not equal'
      });
    });

    it('should update order and return success if mac is valid and order found', async () => {
      ZaloPayService.verifyCallback.mockReturnValue(true);
      const mockOrder = {
        _id: 'order123',
        status: 'pending',
        payment_status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };
      orderModel.findOne.mockResolvedValue(mockOrder);

      await zaloPayController.callback(req, res);

      expect(orderModel.findOne).toHaveBeenCalledWith({
        transaction_id: '230101_123456'
      });
      expect(mockOrder.payment_status).toBe('paid');
      expect(mockOrder.status).toBe('confirmed');
      expect(mockOrder.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        return_code: 1,
        return_message: 'success'
      });
    });

    it('should return success even if order not found (to prevent retry)', async () => {
      ZaloPayService.verifyCallback.mockReturnValue(true);
      orderModel.findOne.mockResolvedValue(null);

      await zaloPayController.callback(req, res);

      expect(res.json).toHaveBeenCalledWith({
        return_code: 1,
        return_message: 'success'
      });
    });

    it('should return return_code 0 on exception', async () => {
      ZaloPayService.verifyCallback.mockImplementation(() => {
        throw new Error('Unexpected Error');
      });

      await zaloPayController.callback(req, res);

      expect(res.json).toHaveBeenCalledWith({
        return_code: 0,
        return_message: 'Unexpected Error'
      });
    });
  });
});
