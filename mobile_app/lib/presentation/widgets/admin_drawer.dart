import 'package:flutter/material.dart';
import 'package:bizflow_mobile/data/repositories/auth_repository.dart';
import 'package:bizflow_mobile/presentation/screens/auth/login_screen.dart';

// Import tất cả các màn hình Admin
import 'package:bizflow_mobile/presentation/screens/admin/admin_dashboard_screen.dart';
import 'package:bizflow_mobile/presentation/screens/admin/shop_owner_management_screen.dart';
import 'package:bizflow_mobile/presentation/screens/admin/reports_screen.dart';
import 'package:bizflow_mobile/presentation/screens/admin/service_packages_screen.dart';
import 'package:bizflow_mobile/presentation/screens/admin/settings_screen.dart';

class AdminDrawer extends StatelessWidget {
  final String currentRoute; // Để biết đang ở trang nào mà tô màu

  const AdminDrawer({super.key, required this.currentRoute});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Header
          UserAccountsDrawerHeader(
            decoration: BoxDecoration(color: Colors.blue[800]),
            accountName: const Text("Admin System", style: TextStyle(fontWeight: FontWeight.bold)),
            accountEmail: const Text("admin@bizflow.com"),
            currentAccountPicture: const CircleAvatar(
              backgroundColor: Colors.white,
              child: Icon(Icons.admin_panel_settings, size: 30, color: Colors.blue),
            ),
          ),
          
          // Danh sách Menu
          _buildItem(context, Icons.dashboard, "Tổng quan", "Dashboard"),
          _buildItem(context, Icons.people, "Quản lý chủ shop", "ShopOwner"),
          _buildItem(context, Icons.card_giftcard, "Gói dịch vụ", "ServicePackages"),
          _buildItem(context, Icons.bar_chart, "Báo cáo & Phân tích", "Reports"),
          const Divider(),
          _buildItem(context, Icons.settings, "Cấu hình hệ thống", "Settings"),
          _buildItem(context, Icons.logout, "Đăng xuất", "Logout", isLogout: true),
        ],
      ),
    );
  }

  Widget _buildItem(BuildContext context, IconData icon, String title, String routeName, {bool isLogout = false}) {
    final isSelected = currentRoute == routeName;
    final color = isLogout ? Colors.red : (isSelected ? Colors.blue : Colors.black87);

    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(
        title,
        style: TextStyle(color: color, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal),
      ),
      selected: isSelected,
      selectedTileColor: Colors.blue.withOpacity(0.1),
      onTap: () async {
        Navigator.pop(context); // Đóng menu

        if (isLogout) {
          await AuthRepository().logout();
          Navigator.pushAndRemoveUntil(
            context, 
            MaterialPageRoute(builder: (_) => const LoginScreen()), 
            (route) => false
          );
          return;
        }

        if (isSelected) return; // Nếu đang ở trang này rồi thì không làm gì

        // Điều hướng
        Widget page;
        switch (routeName) {
          case "Dashboard": page = const AdminDashboardScreen(); break;
          case "ShopOwner": page = const ShopOwnerManagementScreen(); break;
          case "ServicePackages": page = const ServicePackagesScreen(); break;
          case "Reports": page = const ReportsScreen(); break;
          case "Settings": page = const SettingsScreen(); break;
          default: page = const AdminDashboardScreen();
        }

        // Dùng pushReplacement để không bị chồng trang (Back sẽ thoát app hoặc về Login tùy logic)
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => page));
      },
    );
  }
}