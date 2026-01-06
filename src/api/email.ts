// src/api/email.ts

import { supabase } from '../supabaseClient'; // Nhập kết nối Supabase đã tạo

// Định nghĩa kiểu dữ liệu (interface) cho dữ liệu thư
interface MessageData {
    sender_email: string;
    recipient_email: string;
    subject: string;
    body: string;
}

/**
 * Hàm gửi thư nội bộ (ghi dữ liệu vào bảng 'messages')
 * @param data Dữ liệu thư: người gửi, người nhận, tiêu đề, nội dung
 * @returns true nếu gửi thành công, false nếu có lỗi
 */
export async function sendInternalEmail(data: MessageData): Promise<boolean> {
    const { error } = await supabase
        .from('messages') // Tên bảng Database: messages
        .insert({
            sender_email: data.sender_email, 
            recipient_email: data.recipient_email,
            subject: data.subject,
            body: data.body,
        });

    if (error) {
        console.error('Lỗi khi gửi thư:', error.message);
        return false;
    }

    return true;
}

// Bổ sung: Hàm đọc Hộp thư đến (Inbox)
/**
 * Lấy tất cả thư nhận được bởi một email cụ thể
 * @param email Email của người dùng hiện tại
 * @returns Array chứa các thư hoặc null nếu có lỗi
 */
export async function getInbox(email: string) {
    const { data, error } = await supabase
        .from('messages')
        .select('*') // Lấy tất cả các cột
        .eq('recipient_email', email) // Lọc theo email người nhận
        .order('created_at', { ascending: false }); // Sắp xếp theo thời gian mới nhất

    if (error) {
        console.error('Lỗi khi tải Inbox:', error.message);
        return null;
    }

    return data;
}