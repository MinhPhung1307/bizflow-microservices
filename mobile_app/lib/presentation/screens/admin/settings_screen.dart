import 'package:flutter/material.dart';
import 'package:bizflow_mobile/presentation/widgets/admin_drawer.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notification = true;
  bool _darkMode = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Cấu hình hệ thống"), backgroundColor: Colors.blue[800]),
      drawer: const AdminDrawer(currentRoute: "Settings"),
      body: ListView(
        children: [
          const SizedBox(height: 10),
          _buildSectionHeader("Cài đặt chung"),
          SwitchListTile(
            title: const Text("Thông báo hệ thống"),
            subtitle: const Text("Nhận thông báo khi có Owner mới"),
            value: _notification,
            onChanged: (val) => setState(() => _notification = val),
          ),
          SwitchListTile(
            title: const Text("Chế độ tối (Dark Mode)"),
            value: _darkMode,
            onChanged: (val) => setState(() => _darkMode = val),
          ),
          const Divider(),
          _buildSectionHeader("Tài khoản Admin"),
          ListTile(
            leading: const Icon(Icons.lock),
            title: const Text("Đổi mật khẩu"),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.language),
            title: const Text("Ngôn ngữ"),
            subtitle: const Text("Tiếng Việt"),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {},
          ),
          const Padding(
            padding: EdgeInsets.all(20.0),
            child: Text("Phiên bản App: 1.0.0", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
          )
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(title, style: TextStyle(color: Colors.blue[800], fontWeight: FontWeight.bold)),
    );
  }
}