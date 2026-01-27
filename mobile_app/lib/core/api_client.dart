// lib/core/api_client.dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Thay đổi từ 10.0.2.2 (emulator) thành IP máy host cho device thật
  static const String baseUrl = 'http://192.168.1.57:8000/api';

  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      contentType: Headers.jsonContentType,
    ),
  );

  ApiClient() {
    // Tự động thêm Token vào Header mỗi khi gọi API
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('accessToken');

        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        // Xử lý lỗi chung (Ví dụ: 401 Unauthorized -> Đăng xuất)
        print("API Error: ${e.response?.statusCode} - ${e.message}");
        return handler.next(e);
      },
    ));
  }

  Dio get dio => _dio;
}
