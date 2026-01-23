'use client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt')?.value || request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;

  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Định nghĩa các route
  const isAdminRoute = pathname.startsWith('/admin');
  const isOwnerRoute = pathname.startsWith('/dashboard'); // Route cho Owner
  const isPosRoute = pathname.startsWith('/pos');         // Route cho Employee
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isRootRoute = pathname === '/';

  // --- LOGIC 1: XỬ LÝ TRANG CHỦ (ROOT /) ---
  // Đây là phần khắc phục vấn đề của bạn
  if (isRootRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Nếu đã có token, điều hướng dựa trên Role
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'OWNER') return NextResponse.redirect(new URL('/dashboard', request.url));
    if (role === 'EMPLOYEE') return NextResponse.redirect(new URL('/pos', request.url));
    
    // Mặc định nếu không xác định được role
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- LOGIC 2: CHƯA ĐĂNG NHẬP MÀ CỐ VÀO TRANG BẢO VỆ ---
  if (!token) {
    if (isAdminRoute || isOwnerRoute || isPosRoute) {
      const loginUrl = new URL('/login', request.url);
      // Có thể thêm ?callbackUrl=... để redirect lại sau khi login nếu muốn
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // --- LOGIC 3: ĐÃ ĐĂNG NHẬP MÀ CỐ VÀO TRANG LOGIN/REGISTER ---
  if (isAuthRoute) {
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'OWNER') return NextResponse.redirect(new URL('/dashboard', request.url));
    if (role === 'EMPLOYEE') return NextResponse.redirect(new URL('/pos', request.url));
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- LOGIC 4: PHÂN QUYỀN (Role-based Access Control) ---
  
  // ADMIN: Không được vào Dashboard bán hàng của Owner/Employee
  if (role === 'ADMIN' && (isOwnerRoute || isPosRoute)) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // EMPLOYEE: Chỉ được vào POS
  if (role === 'EMPLOYEE' && (isAdminRoute || isOwnerRoute)) {
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  // OWNER: Được vào Dashboard VÀ POS, nhưng không được vào Admin hệ thống
  if (role === 'OWNER' && isAdminRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Matcher bỏ qua các file tĩnh và API
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};