import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart'; // Thư viện vẽ biểu đồ
import 'package:intl/intl.dart';

// Import Widget Menu dùng chung (Quan trọng)
import 'package:bizflow_mobile/presentation/widgets/admin_drawer.dart';

// --- MODELS GIẢ LẬP ---
class StatData {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final Color bgColor;

  StatData(this.title, this.value, this.icon, this.color, this.bgColor);
}

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  // Biến filter thời gian cho 2 biểu đồ
  String _revenueRange = '7d';
  String _growthRange = '7d';

  // Dữ liệu thống kê giả
  final List<StatData> _stats = [
    StatData("Tổng Owner", "1,240", Icons.people, Colors.blue, Colors.blue.shade50),
    StatData("Đang hoạt động", "1,180", Icons.local_activity, Colors.green, Colors.green.shade50),
    StatData("Gói dịch vụ", "3", Icons.credit_card, Colors.purple, Colors.purple.shade50),
    StatData("GMV Hệ thống", "4.5 tỷ", Icons.trending_up, Colors.orange, Colors.orange.shade50),
  ];

  // Định dạng tiền tệ
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      
      // --- APP BAR ---
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Tổng quan hệ thống", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text("Hiệu suất & Tăng trưởng", style: TextStyle(fontSize: 12, color: Colors.white70)),
          ],
        ),
        backgroundColor: Colors.blue[800],
        elevation: 0,
      ),

      // --- MENU (SỬ DỤNG WIDGET CHUNG, KHÔNG VIẾT LẠI CODE) ---
      drawer: const AdminDrawer(currentRoute: "Dashboard"), 

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- 1. STAT CARDS (GRID 2 CỘT) ---
            GridView.builder(
              shrinkWrap: true, // Quan trọng: Để Grid nằm trong ScrollView
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _stats.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2, // 2 cột trên mobile
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.4, // Tỉ lệ chiều rộng/cao của card
              ),
              itemBuilder: (context, index) => _buildStatCard(_stats[index]),
            ),

            const SizedBox(height: 24),

            // --- 2. BIỂU ĐỒ DOANH THU (AREA CHART) ---
            _buildChartSection(
              title: "Doanh thu hệ thống",
              subTitle: "Tổng giá trị giao dịch (GMV)",
              filterValue: _revenueRange,
              onFilterChanged: (val) => setState(() => _revenueRange = val!),
              chart: _buildRevenueChart(),
            ),

            const SizedBox(height: 24),

            // --- 3. BIỂU ĐỒ TĂNG TRƯỞNG (BAR CHART) ---
            _buildChartSection(
              title: "Tăng trưởng người dùng",
              subTitle: "Số lượng đăng ký mới",
              filterValue: _growthRange,
              onFilterChanged: (val) => setState(() => _growthRange = val!),
              chart: _buildGrowthChart(),
            ),
            
            const SizedBox(height: 40), // Padding bottom
          ],
        ),
      ),
    );
  }

  // --- WIDGETS CON (StatCard & Charts) ---

  // 1. Stat Card
  Widget _buildStatCard(StatData data) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: data.bgColor, borderRadius: BorderRadius.circular(8)),
            child: Icon(data.icon, color: data.color, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(data.value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87)),
              Text(data.title, style: TextStyle(fontSize: 12, color: Colors.grey[500], fontWeight: FontWeight.w500)),
            ],
          )
        ],
      ),
    );
  }

  // 2. Khung chứa biểu đồ (Header + Filter + Chart)
  Widget _buildChartSection({
    required String title,
    required String subTitle,
    required String filterValue,
    required Function(String?) onFilterChanged,
    required Widget chart,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(subTitle, style: TextStyle(fontSize: 12, color: Colors.grey[400])),
                ],
              ),
              // Dropdown Filter nhỏ gọn
              Container(
                height: 32,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(6)),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: filterValue,
                    icon: const Icon(Icons.arrow_drop_down, size: 18),
                    style: const TextStyle(fontSize: 12, color: Colors.black87),
                    onChanged: onFilterChanged,
                    items: const [
                      DropdownMenuItem(value: '7d', child: Text("7 ngày")),
                      DropdownMenuItem(value: '1m', child: Text("Tháng này")),
                      DropdownMenuItem(value: '1y', child: Text("Năm này")),
                    ],
                  ),
                ),
              )
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(height: 200, child: chart), // Chiều cao cố định cho biểu đồ
        ],
      ),
    );
  }

  // 3. Biểu đồ Doanh thu (LineChart giả lập AreaChart)
  Widget _buildRevenueChart() {
    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true, 
          drawVerticalLine: false, 
          getDrawingHorizontalLine: (value) => FlLine(color: Colors.grey[200], strokeWidth: 1),
        ),
        titlesData: FlTitlesData(
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (val, meta) {
                // Giả lập ngày: 1->T2, 2->T3...
                const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
                if (val.toInt() >= 0 && val.toInt() < days.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(days[val.toInt()], style: TextStyle(color: Colors.grey[400], fontSize: 10)),
                  );
                }
                return const Text('');
              },
              interval: 1,
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (val, meta) {
                if (val == 0) return const Text('');
                return Text('${val.toInt()}M', style: TextStyle(color: Colors.grey[400], fontSize: 10));
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        minX: 0, maxX: 6, minY: 0, maxY: 6,
        lineBarsData: [
          LineChartBarData(
            spots: const [
              FlSpot(0, 2), FlSpot(1, 1.5), FlSpot(2, 3), FlSpot(3, 2.2), 
              FlSpot(4, 4), FlSpot(5, 3.5), FlSpot(6, 5),
            ],
            isCurved: true,
            color: Colors.orange,
            barWidth: 3,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              color: Colors.orange.withOpacity(0.1), // Tạo hiệu ứng Area
            ),
          ),
        ],
      ),
    );
  }

  // 4. Biểu đồ Tăng trưởng (BarChart)
  Widget _buildGrowthChart() {
    return BarChart(
      BarChartData(
        gridData: FlGridData(show: false),
        titlesData: FlTitlesData(
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)), // Ẩn trục Y cho gọn
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (val, meta) {
                const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
                if (val.toInt() >= 0 && val.toInt() < days.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(days[val.toInt()], style: TextStyle(color: Colors.grey[400], fontSize: 10)),
                  );
                }
                return const Text('');
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        barGroups: [
          _makeBarGroup(0, 5), _makeBarGroup(1, 8), _makeBarGroup(2, 6),
          _makeBarGroup(3, 12), _makeBarGroup(4, 10), _makeBarGroup(5, 15), _makeBarGroup(6, 9),
        ],
      ),
    );
  }

  BarChartGroupData _makeBarGroup(int x, double y) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: Colors.blue,
          width: 16,
          borderRadius: const BorderRadius.only(topLeft: Radius.circular(4), topRight: Radius.circular(4)),
        ),
      ],
    );
  }
  
  // ĐÃ XÓA: Hàm _buildAdminDrawer và _buildDrawerItem vì đã chuyển sang file admin_drawer.dart
}