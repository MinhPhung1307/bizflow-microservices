import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart'; // Thêm thư viện font nếu bạn đã cài
import 'presentation/screens/auth/login_screen.dart'; // Import đúng đường dẫn màn hình Login

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BizFlow',
      debugShowCheckedModeBanner: false, // Tắt chữ DEBUG góc phải
      theme: ThemeData(
        // SỬA LỖI 1: Viết đầy đủ ColorScheme.fromSeed
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
        // Cấu hình Font chữ toàn app (Tùy chọn)
        // textTheme: GoogleFonts.interTextTheme(), 
      ),
      // Màn hình đầu tiên khi mở App là LoginScreen
      home: const LoginScreen(),
    );
  }
}