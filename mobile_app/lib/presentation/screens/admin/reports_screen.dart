import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:bizflow_mobile/data/models/report_models.dart';
import 'package:bizflow_mobile/data/repositories/admin_repository.dart';

// 1. IMPORT MENU DÙNG CHUNG
import 'package:bizflow_mobile/presentation/widgets/admin_drawer.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final AdminRepository _repo = AdminRepository();
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  List<PaymentStat> _paymentStats = [];
  List<TopOwner> _topOwners = [];
  bool _isLoading = true;

  // Màu sắc cho biểu đồ (Khớp với React)
  final List<Color> _chartColors = [Colors.blue, Colors.green, Colors.orange, Colors.red];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    // Gọi song song 2 API cho nhanh
    try {
      final results = await Future.wait([
        _repo.getPaymentStats(),
        _repo.getTopOwners(),
      ]);

      setState(() {
        _paymentStats = results[0] as List<PaymentStat>;
        _topOwners = results[1] as List<TopOwner>;
        _isLoading = false;
      });
    } catch (e) {
      print("Lỗi tải báo cáo: $e");
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Báo cáo chuyên sâu", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text("Phân tích dòng tiền & Hiệu suất", style: TextStyle(fontSize: 12, color: Colors.white70)),
          ],
        ),
        backgroundColor: Colors.blue[800],
      ),
      
      // 2. SỬ DỤNG MENU DÙNG CHUNG
      drawer: const AdminDrawer(currentRoute: "Reports"),
      
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // --- 1. BIỂU ĐỒ TRÒN (CƠ CẤU NGUỒN TIỀN) ---
                  _buildSectionTitle("Cơ cấu nguồn tiền", "Phân bố doanh thu theo phương thức thanh toán"),
                  const SizedBox(height: 12),
                  _buildPieChartCard(),

                  const SizedBox(height: 24),

                  // --- 2. THỐNG KÊ NHANH (GRID 3 CỘT) ---
                  _buildQuickStatsGrid(),

                  const SizedBox(height: 24),

                  // --- 3. TOP OWNERS (DANH SÁCH) ---
                  _buildSectionTitle("Top Chủ Cửa Hàng", "5 Owner có doanh số cao nhất"),
                  const SizedBox(height: 12),
                  _buildTopOwnersList(),
                  
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionTitle(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
        Text(subtitle, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
      ],
    );
  }

  // --- WIDGET: PIE CHART ---
  Widget _buildPieChartCard() {
    if (_paymentStats.isEmpty) return const Center(child: Padding(padding: EdgeInsets.all(20), child: Text("Chưa có dữ liệu thanh toán")));

    // Tính tổng để tính phần trăm
    double totalValue = _paymentStats.fold(0, (sum, item) => sum + item.value);
    if (totalValue == 0) totalValue = 1; // Tránh chia cho 0

    return Container(
      height: 320,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 5)]),
      child: Column(
        children: [
          Expanded(
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 40,
                sections: _paymentStats.asMap().map((index, item) {
                  final isLarge = item.value / totalValue > 0.1; // Nếu > 10% thì hiện to hơn
                  final color = _chartColors[index % _chartColors.length];
                  return MapEntry(index, PieChartSectionData(
                    color: color,
                    value: item.value,
                    title: '${((item.value/totalValue)*100).toStringAsFixed(0)}%',
                    radius: isLarge ? 60 : 50,
                    titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  ));
                }).values.toList(),
              ),
            ),
          ),
          const SizedBox(height: 20),
          // Legend (Chú thích)
          Wrap(
            spacing: 16,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: _paymentStats.asMap().map((index, item) {
              return MapEntry(index, Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: 12, height: 12, decoration: BoxDecoration(shape: BoxShape.circle, color: _chartColors[index % _chartColors.length])),
                  const SizedBox(width: 6),
                  Text(item.label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                ],
              ));
            }).values.toList(),
          )
        ],
      ),
    );
  }

  // --- WIDGET: QUICK STATS ---
  Widget _buildQuickStatsGrid() {
    // Helper tìm value theo method
    double getValue(String method) => _paymentStats.firstWhere((e) => e.method == method, orElse: () => PaymentStat(method: '', value: 0, count: 0)).value;

    return Column(
      children: [
        _buildStatTile("Tiền mặt", getValue("CASH"), Icons.money, Colors.green),
        const SizedBox(height: 10),
        _buildStatTile("Chuyển khoản", getValue("TRANSFER"), Icons.credit_card, Colors.blue),
        const SizedBox(height: 10),
        _buildStatTile("Ghi nợ", getValue("DEBT"), Icons.account_balance_wallet, Colors.red),
      ],
    );
  }

  Widget _buildStatTile(String label, double value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                Text(currencyFormat.format(value), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
          )
        ],
      ),
    );
  }

  // --- WIDGET: TOP OWNERS ---
  Widget _buildTopOwnersList() {
    if (_topOwners.isEmpty) return const Center(child: Padding(padding: EdgeInsets.all(20), child: Text("Chưa có dữ liệu xếp hạng")));

    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _topOwners.length,
        separatorBuilder: (ctx, i) => const Divider(height: 1, indent: 60),
        itemBuilder: (context, index) {
          final owner = _topOwners[index];
          // Màu sắc cho Top 1, 2, 3 
          Color badgeColor = Colors.grey.shade200;
          Color textColor = Colors.grey.shade700;
          if (index == 0) { badgeColor = Colors.yellow.shade100; textColor = Colors.orange.shade800; }
          else if (index == 1) { badgeColor = Colors.grey.shade300; textColor = Colors.grey.shade800; }
          else if (index == 2) { badgeColor = Colors.orange.shade100; textColor = Colors.brown.shade700; }

          return ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: Container(
              width: 36, height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: badgeColor, shape: BoxShape.circle),
              child: Text("#${index + 1}", style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
            ),
            title: Text(owner.fullName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            subtitle: Text(owner.phoneNumber, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(currencyFormat.format(owner.totalRevenue), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue, fontSize: 14)),
                Text("${owner.totalOrders} đơn", style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              ],
            ),
          );
        },
      ),
    );
  }

  
}