import 'package:flutter/material.dart';
import 'package:bizflow_mobile/data/models/owner_model.dart';
import 'package:bizflow_mobile/data/repositories/admin_repository.dart';

// 1. IMPORT MENU DÙNG CHUNG
import 'package:bizflow_mobile/presentation/widgets/admin_drawer.dart';

class ShopOwnerManagementScreen extends StatefulWidget {
  const ShopOwnerManagementScreen({super.key});

  @override
  State<ShopOwnerManagementScreen> createState() => _ShopOwnerManagementScreenState();
}

class _ShopOwnerManagementScreenState extends State<ShopOwnerManagementScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final AdminRepository _adminRepo = AdminRepository();

  // Dữ liệu thật
  List<Owner> _owners = [];
  bool _isLoading = true;
  String _currentFilter = "ALL"; // Bộ lọc hiện tại

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    
    // Lắng nghe sự kiện chuyển Tab để load lại dữ liệu tương ứng
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        // Map index sang status string
        final statuses = ["ALL", "PENDING", "ACTIVE", "LOCKED", "REJECTED"];
        setState(() {
          _currentFilter = statuses[_tabController.index];
          _fetchOwners(); // Gọi API lại khi chuyển tab
        });
      }
    });

    _fetchOwners(); // Load lần đầu
  }

  // Hàm gọi API lấy danh sách
  Future<void> _fetchOwners() async {
    setState(() => _isLoading = true);
    try {
      final data = await _adminRepo.getOwners(status: _currentFilter);
      setState(() {
        _owners = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      // Có thể show toast lỗi ở đây
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // --- LOGIC MÀU SẮC TRẠNG THÁI ---
  Color _getStatusColor(String status) {
    switch (status) {
      case 'ACTIVE': return Colors.green;
      case 'PENDING': return Colors.orange;
      case 'LOCKED': return Colors.red;
      case 'REJECTED': return Colors.grey;
      default: return Colors.blue;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'ACTIVE': return 'Hoạt động';
      case 'PENDING': return 'Chờ duyệt';
      case 'LOCKED': return 'Đã khóa';
      case 'REJECTED': return 'Từ chối';
      default: return status;
    }
  }

  // --- SHOW DIALOG THÊM / SỬA ---
  void _showOwnerDialog({Owner? owner}) {
    showDialog(
      context: context,
      builder: (context) => _OwnerFormDialog(
        initialOwner: owner,
        onSave: (data) async {
          // Xử lý lưu dữ liệu
          try {
            bool success;
            if (owner == null) {
              success = await _adminRepo.createOwner(data);
            } else {
              success = await _adminRepo.updateOwner(owner.id, data);
            }

            if (success) {
              Navigator.pop(context); // Đóng Dialog
              _fetchOwners(); // Reload lại danh sách
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(owner == null ? "Thêm mới thành công" : "Cập nhật thành công"), backgroundColor: Colors.green),
              );
            }
          } catch (e) {
            ScaffoldMessenger.of(context).showSnackBar(
               SnackBar(content: Text("Lỗi: $e"), backgroundColor: Colors.red),
            );
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      
      // --- APP BAR ---
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Quản lý Chủ Cửa Hàng", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text("Danh sách Owner hệ thống", style: TextStyle(fontSize: 12, color: Colors.white70)),
          ],
        ),
        backgroundColor: Colors.blue[800],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: "Tất cả"),
            Tab(text: "Chờ duyệt"),
            Tab(text: "Hoạt động"),
            Tab(text: "Đã khóa"),
            Tab(text: "Từ chối"),
          ],
        ),
      ),

      // --- 2. SỬ DỤNG MENU DÙNG CHUNG ---
      drawer: const AdminDrawer(currentRoute: "ShopOwner"),

      // --- FAB (NÚT THÊM) ---
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showOwnerDialog(), // Mở form tạo mới
        backgroundColor: Colors.blue[800],
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text("Thêm Owner", style: TextStyle(color: Colors.white)),
      ),

      // --- BODY (LIST) ---
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : RefreshIndicator(
              onRefresh: _fetchOwners, // Kéo xuống để refresh
              child: _buildOwnerList(),
            ),
    );
  }

  Widget _buildOwnerList() {
    if (_owners.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_outlined, size: 60, color: Colors.grey[400]),
            const SizedBox(height: 10),
            Text("Không có dữ liệu", style: TextStyle(color: Colors.grey[500])),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 80, top: 10),
      itemCount: _owners.length,
      itemBuilder: (context, index) {
        final owner = _owners[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(owner.fullName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.store, size: 14, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(owner.shopName ?? "Chưa đặt tên Shop", style: TextStyle(fontSize: 13, color: Colors.grey[700])),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(owner.status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: _getStatusColor(owner.status).withOpacity(0.5)),
                      ),
                      child: Text(_getStatusText(owner.status), style: TextStyle(color: _getStatusColor(owner.status), fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
                const Divider(height: 24),
                // Footer
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.phone, size: 16, color: Colors.grey),
                        const SizedBox(width: 8),
                        Text(owner.phoneNumber, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit, color: Colors.blue),
                      onPressed: () => _showOwnerDialog(owner: owner), // Mở form sửa
                    )
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ĐÃ XÓA CÁC HÀM _buildAdminDrawer và _buildDrawerItem THỪA Ở ĐÂY
}

// --- CLASS RIÊNG CHO FORM DIALOG (FORM TẠO/SỬA) ---
class _OwnerFormDialog extends StatefulWidget {
  final Owner? initialOwner;
  final Function(Map<String, dynamic>) onSave;

  const _OwnerFormDialog({this.initialOwner, required this.onSave});

  @override
  State<_OwnerFormDialog> createState() => _OwnerFormDialogState();
}

class _OwnerFormDialogState extends State<_OwnerFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _shopNameCtrl;
  late TextEditingController _passwordCtrl;
  String _status = "PENDING";
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final o = widget.initialOwner;
    _nameCtrl = TextEditingController(text: o?.fullName ?? '');
    _phoneCtrl = TextEditingController(text: o?.phoneNumber ?? '');
    _shopNameCtrl = TextEditingController(text: o?.shopName ?? '');
    _passwordCtrl = TextEditingController(); // Mật khẩu luôn trống khi edit
    _status = o?.status ?? "PENDING";
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.initialOwner != null;

    return AlertDialog(
      title: Text(isEdit ? "Cập nhật Owner" : "Thêm Owner mới"),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameCtrl,
                decoration: const InputDecoration(labelText: "Họ và tên"),
                validator: (v) => v!.isEmpty ? "Không được để trống" : null,
              ),
              TextFormField(
                controller: _phoneCtrl,
                decoration: const InputDecoration(labelText: "Số điện thoại"),
                keyboardType: TextInputType.phone,
                validator: (v) => v!.isEmpty ? "Không được để trống" : null,
              ),
              if (!isEdit) // Chỉ hiện mật khẩu khi tạo mới
                TextFormField(
                  controller: _passwordCtrl,
                  decoration: const InputDecoration(labelText: "Mật khẩu"),
                  obscureText: true,
                  validator: (v) => v!.isEmpty ? "Không được để trống" : null,
                ),
              TextFormField(
                controller: _shopNameCtrl,
                decoration: const InputDecoration(labelText: "Tên Shop (Tùy chọn)"),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _status,
                decoration: const InputDecoration(labelText: "Trạng thái"),
                items: const [
                  DropdownMenuItem(value: "PENDING", child: Text("Chờ duyệt")),
                  DropdownMenuItem(value: "ACTIVE", child: Text("Hoạt động")),
                  DropdownMenuItem(value: "LOCKED", child: Text("Đã khóa")),
                  DropdownMenuItem(value: "REJECTED", child: Text("Từ chối")),
                ],
                onChanged: (val) => setState(() => _status = val!),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text("Hủy")),
        ElevatedButton(
          onPressed: _isLoading ? null : () async {
            if (_formKey.currentState!.validate()) {
              setState(() => _isLoading = true);
              
              final data = {
                'full_name': _nameCtrl.text,
                'phone_number': _phoneCtrl.text,
                'shop_name': _shopNameCtrl.text,
                'status': _status,
              };

              if (!isEdit) {
                 data['password'] = _passwordCtrl.text; // Gửi password khi tạo mới
              }

              await widget.onSave(data);
              setState(() => _isLoading = false);
            }
          },
          child: _isLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator()) : const Text("Lưu"),
        ),
      ],
    );
  }
}