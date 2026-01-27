import 'package:flutter/material.dart';
import 'package:bizflow_mobile/presentation/widgets/admin_drawer.dart';

class ServicePackagesScreen extends StatelessWidget {
  const ServicePackagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Gói dịch vụ"),
        backgroundColor: Colors.blue[800],
      ),
      drawer: const AdminDrawer(currentRoute: "ServicePackages"), // Gọi Menu chung
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildPackageCard("Cơ bản (Basic)", "Miễn phí", Colors.grey, ["Quản lý 1 cửa hàng", "Tối đa 50 đơn/tháng", "Báo cáo cơ bản"]),
          _buildPackageCard("Chuyên nghiệp (Pro)", "199.000đ / tháng", Colors.blue, ["Quản lý 3 cửa hàng", "Không giới hạn đơn", "Báo cáo nâng cao", "Hỗ trợ 24/7"], isPopular: true),
          _buildPackageCard("Doanh nghiệp (Enterprise)", "499.000đ / tháng", Colors.purple, ["Chuỗi cửa hàng không giới hạn", "API tích hợp riêng", "Quản lý nhân viên chi tiết"]),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: Colors.blue[800],
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildPackageCard(String title, String price, Color color, List<String> features, {bool isPopular = false}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: isPopular ? const BorderSide(color: Colors.blue, width: 2) : BorderSide.none),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isPopular) 
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(color: Colors.blue, borderRadius: BorderRadius.circular(4)),
                child: const Text("Phổ biến nhất", style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            Text(title, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 8),
            Text(price, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87)),
            const Divider(height: 24),
            ...features.map((e) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(children: [const Icon(Icons.check_circle, color: Colors.green, size: 18), const SizedBox(width: 8), Text(e)]),
            )),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: color, foregroundColor: Colors.white),
                onPressed: () {},
                child: const Text("Chỉnh sửa gói"),
              ),
            )
          ],
        ),
      ),
    );
  }
}