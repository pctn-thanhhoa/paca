/**
 * DM_TIEU_CHI - Bộ chỉ số cấp tỉnh theo Phụ lục II, Quyết định số 47/2026/QĐ-TTg ngày 30/9/2026.
 * NGUỒN DUY NHẤT về tiêu chí cho: máy chủ (chấm điểm), biểu mẫu sở ngành, biểu mẫu xã/phường.
 *
 * Quy ước:
 *  - cap: cấp hiển thị (1 = nhóm A/B/C/D/Đ/E).
 *  - rule: cách tính (xem 03_Scoring.js). Không có rule = dòng tổng hợp (cộng các tiêu chí con).
 *  - donVi: phần số liệu do SỞ/XÃ nhập. apDung: 'SO' | 'XA' | 'CA_HAI'.
 *      + kieu 'dv'  : đơn vị ghi văn bản minh chứng + tải tệp (đã tải tệp là đã thực hiện); "không thuộc diện" thì ghi lý do
 *                     -> tỉnh đếm số đơn vị (tử số / mẫu số).
 *      + fields     : các ô số liệu cụ thể (cộng dồn toàn tỉnh).
 *  - tinh: các ô số liệu cấp tỉnh: đơn vị đầu mối nhập trên web (dauMoi), hoặc Tổ công tác đánh giá xác định trên trang
 *          thẩm định (A.1, Đ.2, E - lưu ở sheet NHAP_TINH). Số liệu toàn tỉnh nhóm C, D tổng hợp tự động từ sở, xã.
 *  - canhBao: điểm văn bản chưa rõ, cần xin hướng dẫn (hiển thị trong bảng điểm).
 *
 * Mọi diễn giải trong tệp này cần đối chiếu lại bản gốc Phụ lục II trước khi sử dụng chính thức.
 */

var YESNO = 'yesno';
var NUM = 'number';
var MONEY = 'money';
var TEXT = 'text';
var SELECT = 'select';

var PACA_CRITERIA = [
  // ======================= A =======================
  { ma: 'A', cap: 1, max: 18, ten: 'TIÊU CHÍ ĐÁNH GIÁ VIỆC XÂY DỰNG VÀ HOÀN THIỆN CHÍNH SÁCH, PHÁP LUẬT ĐỂ PCTNLPTC' },
  { ma: 'A.1', cap: 2, max: 5, ten: 'Đánh giá việc lãnh đạo, chỉ đạo' },
  { ma: 'A.1.1', cap: 3, max: 2.5, ten: 'Lãnh đạo, chỉ đạo xây dựng và hoàn thiện chính sách, pháp luật để PCTNLPTC' },
  { ma: 'A.1.1.1', cap: 4, max: 0.5, rule: 'parts', ten: 'Lãnh đạo, chỉ đạo thực hiện các văn bản của các cơ quan ở Trung ương để PCTNLPTC trong năm',
    cachTinh: 'UBND tỉnh có triển khai: 0,5; không: 0',
    minhChung: 'Liệt kê văn bản của UBND tỉnh triển khai văn bản của Trung ương (thuộc kỳ đánh giá)',
    tinh: [{ k: 'co', t: 'UBND tỉnh có văn bản triển khai trong năm', vb: true, type: YESNO, w: 0.5 }] },
  { ma: 'A.1.1.2', cap: 4, max: 0.5, rule: 'parts', ten: 'Lãnh đạo, chỉ đạo ban hành kế hoạch PCTNLPTC trong năm',
    cachTinh: 'Có ban hành: 0,5; không: 0', minhChung: 'Kế hoạch PCTNLPTC trong năm của UBND tỉnh',
    tinh: [{ k: 'co', t: 'UBND tỉnh có ban hành kế hoạch PCTNLPTC trong năm', vb: true, type: YESNO, w: 0.5 }] },
  { ma: 'A.1.1.3', cap: 4, max: 0.5, rule: 'parts', ten: 'Lãnh đạo, chỉ đạo ban hành Chương trình tiết kiệm, chống lãng phí trong năm',
    cachTinh: 'Có ban hành: 0,5; không: 0', minhChung: 'Chương trình, kế hoạch THTK, CLP trong năm của UBND tỉnh',
    tinh: [{ k: 'co', t: 'UBND tỉnh có ban hành Chương trình THTK, CLP trong năm', vb: true, type: YESNO, w: 0.5 }] },
  { ma: 'A.1.1.4', cap: 4, max: 1, rule: 'level', ten: 'Về xây dựng và hoàn thiện chính sách, pháp luật để PCTNLPTC',
    cachTinh: 'Ban hành và không sửa đổi trong năm: 1; sửa đổi 01 lần: 0,5; từ 02 lần: 0',
    minhChung: 'Liệt kê văn bản xây dựng, hoàn thiện chính sách, pháp luật trong năm (kể cả văn bản sửa đổi, bổ sung)',
    canhBao: 'Phụ lục II chưa quy định mức điểm khi trong năm không ban hành văn bản nào.',
    tinh: [{ k: 'muc', t: 'Mức đạt', type: SELECT, options: [
      { v: 1, t: 'Có ban hành, không phải sửa đổi, bổ sung trong năm (1 điểm)' },
      { v: 0.5, t: 'Có ban hành, phải sửa đổi, bổ sung 01 lần (0,5 điểm)' },
      { v: 0, t: 'Sửa đổi, bổ sung từ 02 lần trở lên (0 điểm)' }] }] },
  { ma: 'A.1.2', cap: 3, max: 1, rule: 'parts', ten: 'Lãnh đạo, chỉ đạo kiểm tra, rà soát, hệ thống hóa VBQPPL để PCTNLPTC',
    cachTinh: 'Kế hoạch PCTNLPTC trong năm có nội dung này: 1; không: 0',
    minhChung: 'Trích nội dung tương ứng trong Kế hoạch PCTNLPTC trong năm của UBND tỉnh',
    tinh: [{ k: 'co', t: 'Kế hoạch PCTNLPTC có nội dung kiểm tra, rà soát, hệ thống hóa VBQPPL', vb: true, type: YESNO, w: 1 }] },
  { ma: 'A.1.3', cap: 3, max: 1.5, ten: 'Lãnh đạo, chỉ đạo phổ biến, giáo dục pháp luật để PCTNLPTC, kiểm tra, theo dõi thi hành VBQPPL' },
  { ma: 'A.1.3.1', cap: 4, max: 0.5, rule: 'parts', ten: 'Về tuyên truyền, phổ biến giáo dục pháp luật để PCTNLPTC',
    cachTinh: 'Kế hoạch PCTNLPTC trong năm có nội dung này: 0,5; không: 0', minhChung: 'Trích nội dung tương ứng trong Kế hoạch',
    tinh: [{ k: 'co', t: 'Kế hoạch có nội dung tuyên truyền, PBGDPL để PCTNLPTC', vb: true, type: YESNO, w: 0.5 }] },
  { ma: 'A.1.3.2', cap: 4, max: 1, rule: 'parts', ten: 'Về kiểm tra và theo dõi thi hành VBQPPL để PCTNLPTC',
    cachTinh: 'Kế hoạch PCTNLPTC trong năm có nội dung này: 1; không: 0', minhChung: 'Trích nội dung tương ứng trong Kế hoạch',
    tinh: [{ k: 'co', t: 'Kế hoạch có nội dung kiểm tra, theo dõi thi hành VBQPPL', vb: true, type: YESNO, w: 1 }] },

  { ma: 'A.2', cap: 2, max: 13, ten: 'Đánh giá việc thực hiện của các sở, ban, ngành; xã, phường' },
  { ma: 'A.2.1', cap: 3, max: 3, rule: 'dv', ten: 'Thực hiện xây dựng và hoàn thiện chính sách, pháp luật để PCTNLPTC',
    cachTinh: '(Số sở, xã có văn bản xây dựng và hoàn thiện chính sách, pháp luật / Tổng số sở, xã có chức năng) × 3',
    minhChung: 'Văn bản xây dựng, hoàn thiện chính sách, pháp luật để PCTNLPTC; văn bản báo cáo kết quả thực hiện',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' },
    canhBao: 'Chưa có tiêu chí xác định đơn vị "có chức năng"; mẫu số do Thanh tra tỉnh rà soát.' },
  { ma: 'A.2.2', cap: 3, max: 2, rule: 'dv', ten: 'Thực hiện kiểm tra, rà soát, hệ thống hóa VBQPPL để PCTNLPTC',
    cachTinh: '(Số sở, xã có văn bản báo cáo kết quả / Tổng số sở, xã có chức năng) × 2',
    minhChung: 'Văn bản báo cáo kết quả kiểm tra, rà soát, hệ thống hóa VBQPPL',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'A.2.3', cap: 3, max: 3, ten: 'Thực hiện Chương trình tiết kiệm, chống lãng phí trong năm' },
  { ma: 'A.2.3.1', cap: 4, max: 1, rule: 'dv', ten: 'Ban hành Chương trình THTK, CLP',
    cachTinh: '(Số sở, xã ban hành Chương trình / Tổng số sở, xã phải ban hành) × 1', minhChung: 'Chương trình THTK, CLP của đơn vị',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'A.2.3.2', cap: 4, max: 2, rule: 'dv', ten: 'Kết quả thực hiện Chương trình THTK, CLP',
    cachTinh: '(Số sở, xã có văn bản báo cáo kết quả / Tổng số sở, xã phải thực hiện) × 2',
    minhChung: 'Báo cáo kết quả, nêu các nhiệm vụ đã hoàn thành đúng hạn và tài liệu chứng minh',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'A.2.4', cap: 3, max: 3, ten: 'Thực hiện công tác phổ biến, giáo dục pháp luật để PCTNLPTC' },
  { ma: 'A.2.4.1', cap: 4, max: 1, rule: 'dv', ten: 'Ban hành kế hoạch tuyên truyền, PBGDPL để PCTNLPTC',
    cachTinh: '(Số sở, xã ban hành kế hoạch / Tổng số sở, xã phải ban hành) × 1', minhChung: 'Kế hoạch tuyên truyền, PBGDPL về PCTNLPTC',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'A.2.4.2', cap: 4, max: 2, rule: 'dv', ten: 'Kết quả thực hiện tuyên truyền, PBGDPL để PCTNLPTC',
    cachTinh: '(Số sở, xã có văn bản báo cáo kết quả / Tổng số sở, xã phải thực hiện) × 2',
    minhChung: 'Báo cáo kết quả, nêu các nhiệm vụ đã hoàn thành đúng hạn và tài liệu chứng minh',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'A.2.5', cap: 3, max: 2, rule: 'dv', ten: 'Thực hiện việc kiểm tra và theo dõi thi hành VBQPPL để PCTNLPTC',
    cachTinh: '(Số sở, xã có văn bản báo cáo kết quả / Tổng số sở, xã có chức năng) × 2',
    minhChung: 'Báo cáo kết quả, nêu các nhiệm vụ đã hoàn thành đúng hạn và tài liệu chứng minh',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },

  // ======================= B =======================
  { ma: 'B', cap: 1, max: 55, ten: 'TIÊU CHÍ ĐÁNH GIÁ VIỆC THỰC HIỆN CÁC BIỆN PHÁP PHÒNG NGỪA' },
  { ma: 'B.1', cap: 2, max: 50, ten: 'Phòng ngừa tham nhũng, lãng phí, tiêu cực trong cơ quan, tổ chức, đơn vị khu vực Nhà nước' },
  { ma: 'B.1.1', cap: 3, max: 8, ten: 'Kết quả thực hiện công khai, minh bạch theo quy định của pháp luật trong một số lĩnh vực' },
  { ma: 'B.1.1.1', cap: 4, max: 1, rule: 'dv', ten: 'Công khai, minh bạch các thủ tục hành chính',
    cachTinh: '(Số sở, xã đã thực hiện / Tổng số sở, xã phải thực hiện) × 1', minhChung: 'Văn bản, đường dẫn thể hiện việc công khai trên thực tế',
    donVi: { apDung: 'CA_HAI', kieu: 'dv', link: true } },
  { ma: 'B.1.1.2', cap: 4, max: 1, rule: 'ratioSum', ten: 'Công khai về tiết kiệm, chống lãng phí',
    cachTinh: '(Số nội dung đã công khai / Tổng số nội dung phải công khai theo pháp luật về THTK, CLP) × 1',
    minhChung: 'Danh mục nội dung phải và đã công khai; văn bản, đường dẫn công khai',
    num: 'ndDa', den: 'ndPhai', zero: 'warn0',
    donVi: { apDung: 'CA_HAI', fields: [
      { k: 'ndPhai', t: 'Số nội dung phải công khai theo pháp luật về THTK, CLP', type: NUM },
      { k: 'ndDa', t: 'Số nội dung đã công khai', type: NUM },
      { k: 'vanBan', t: 'Văn bản, đường dẫn công khai (số, ký hiệu, ngày, cơ quan ban hành, trích yếu hoặc đường dẫn; mỗi văn bản một dòng)', type: TEXT, long: true }] } },
  { ma: 'B.1.1.3', cap: 4, max: 1, rule: 'dv', ten: 'Công khai, minh bạch quy tắc ứng xử của người có chức vụ, quyền hạn',
    cachTinh: '(Số sở, xã đã thực hiện / Tổng số sở, xã phải thực hiện) × 1', minhChung: 'Văn bản, đường dẫn thể hiện việc công khai',
    donVi: { apDung: 'CA_HAI', kieu: 'dv', link: true } },
  { ma: 'B.1.1.4', cap: 4, max: 1, rule: 'dv', ten: 'Công khai, minh bạch tuyển dụng, bổ nhiệm công chức, viên chức',
    cachTinh: '(Số sở, xã đã thực hiện / Tổng số sở, xã phải thực hiện) × 1',
    minhChung: 'Thông báo tuyển dụng, quyết định phê duyệt kết quả tuyển dụng công khai trên cổng thông tin điện tử',
    donVi: { apDung: 'CA_HAI', kieu: 'dv', link: true } },
  { ma: 'B.1.1.5', cap: 4, max: 1, rule: 'dv', ten: 'Công khai, minh bạch về ngân sách nhà nước',
    cachTinh: '(Số sở, xã đã thực hiện / Tổng số sở, xã phải thực hiện) × 1', minhChung: 'Quyết định, văn bản, đường dẫn công khai ngân sách',
    donVi: { apDung: 'CA_HAI', kieu: 'dv', link: true } },
  { ma: 'B.1.1.6', cap: 4, max: 1, rule: 'dv', ten: 'Công khai, minh bạch về tài sản công',
    cachTinh: '(Số sở, xã đã thực hiện / Tổng số sở, xã phải thực hiện) × 1', minhChung: 'Văn bản, đường dẫn công khai tài sản công',
    donVi: { apDung: 'CA_HAI', kieu: 'dv', link: true } },
  { ma: 'B.1.1.7', cap: 4, max: 1, rule: 'dv', ten: 'Công khai, minh bạch về quy hoạch xây dựng, quy hoạch sử dụng đất, kế hoạch sử dụng đất',
    cachTinh: '(Số xã đã thực hiện / Tổng số xã phải thực hiện) × 1', minhChung: 'Văn bản, đường dẫn, hình ảnh thể hiện việc công khai quy hoạch',
    donVi: { apDung: 'XA', kieu: 'dv', link: true },
    canhBao: 'QĐ 47 và Đề cương tính theo số xã; HD chấm điểm địa phương ghi "sở, xã". Công cụ đang tính theo xã.' },
  { ma: 'B.1.1.8', cap: 4, max: 1, rule: 'ratioSum', ten: 'Công khai, minh bạch trong quá trình xây dựng VBQPPL',
    cachTinh: '(Số nội dung đã công khai / Tổng số nội dung phải công khai trong quá trình xây dựng VBQPPL) × 1',
    minhChung: 'Danh mục dự thảo VBQPPL, nội dung đã đăng tải lấy ý kiến; đường dẫn',
    num: 'ndDa', den: 'ndPhai', zero: 'warn0',
    donVi: { apDung: 'CA_HAI', fields: [
      { k: 'ndPhai', t: 'Số nội dung phải công khai trong quá trình xây dựng VBQPPL (0 nếu không chủ trì soạn thảo VBQPPL)', type: NUM },
      { k: 'ndDa', t: 'Số nội dung đã công khai', type: NUM },
      { k: 'vanBan', t: 'Văn bản, đường dẫn công khai (số, ký hiệu, ngày, cơ quan ban hành, trích yếu hoặc đường dẫn; mỗi văn bản một dòng)', type: TEXT, long: true }] } },

  { ma: 'B.1.2', cap: 3, max: 3, ten: 'Kiểm soát xung đột lợi ích' },
  { ma: 'B.1.2.1', cap: 4, max: 1, rule: 'dv', ten: 'Ban hành văn bản triển khai rà soát xung đột lợi ích',
    cachTinh: '(Số sở, xã đã ban hành / Tổng số sở, xã phải thực hiện) × 1', minhChung: 'Văn bản triển khai rà soát XĐLI',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'B.1.2.2', cap: 4, max: 1, rule: 'dv', ten: 'Báo cáo rà soát xung đột lợi ích',
    cachTinh: '(Số sở, xã đã báo cáo / Tổng số sở, xã phải thực hiện) × 1', minhChung: 'Báo cáo rà soát XĐLI',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'B.1.2.3', cap: 4, max: 1, rule: 'xdli', ten: 'Kết quả rà soát xung đột lợi ích',
    cachTinh: 'Không có hoặc xử lý hết: 1; còn 1 vụ chưa xử lý: 0,8; 2 vụ: 0,6; 3 vụ: 0,4; 4 vụ: 0,2; từ 5 vụ: 0',
    minhChung: 'Danh sách vụ XĐLI đã phát hiện, đã xử lý, chưa xử lý (tại thời điểm kết thúc kỳ)',
    donVi: { apDung: 'CA_HAI', fields: [
      { k: 'vuPhatHien', t: 'Số vụ việc XĐLI phát hiện trong kỳ', type: NUM },
      { k: 'vuDaXuLy', t: 'Số vụ đã xử lý xong (đến 14/12/2026)', type: NUM }] } },

  { ma: 'B.1.3', cap: 3, max: 4, ten: 'Định mức, chế độ, tiêu chuẩn' },
  { ma: 'B.1.3.1', cap: 4, max: 2, rule: 'dv', ten: 'Ban hành văn bản để kiểm tra việc thực hiện định mức, chế độ, tiêu chuẩn',
    cachTinh: '(Số sở, xã đã ban hành / Tổng số sở, xã phải ban hành) × 2', minhChung: 'Văn bản (kế hoạch, quyết định) kiểm tra',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'B.1.3.2', cap: 4, max: 2, rule: 'dv', ten: 'Kết quả kiểm tra việc thực hiện định mức, chế độ, tiêu chuẩn',
    cachTinh: '(Số sở, xã đã báo cáo kết quả / Tổng số sở, xã phải thực hiện) × 2',
    minhChung: 'Báo cáo kết quả, nêu các nhiệm vụ đã hoàn thành đúng hạn và tài liệu chứng minh',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'B.1.4', cap: 3, max: 2, rule: 'dv', ten: 'Kết quả thực hiện quy tắc ứng xử',
    cachTinh: '(Số sở, xã đã báo cáo / Tổng số sở, xã phải thực hiện) × 2',
    minhChung: 'Báo cáo việc thực hiện quy tắc ứng xử, nêu nhiệm vụ đã hoàn thành đúng hạn và tài liệu chứng minh',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },

  { ma: 'B.1.5', cap: 3, max: 3, ten: 'Chuyển đổi vị trí công tác của cán bộ, công chức, viên chức' },
  { ma: 'B.1.5.1', cap: 4, max: 1, rule: 'dv', ten: 'Ban hành kế hoạch chuyển đổi vị trí công tác',
    cachTinh: '(Số sở, xã ban hành kế hoạch / Tổng số sở, xã phải ban hành) × 1', minhChung: 'Kế hoạch chuyển đổi vị trí công tác',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'B.1.5.2', cap: 4, max: 1, rule: 'dv', ten: 'Kết quả thực hiện chuyển đổi vị trí công tác',
    cachTinh: '(Số sở, xã báo cáo kết quả / Tổng số sở, xã phải thực hiện) × 1 (tính theo đơn vị, không theo số người)',
    minhChung: 'Báo cáo kết quả; danh sách người phải và đã chuyển đổi (để thuyết minh)',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'B.1.5.3', cap: 4, max: 1, rule: 'b153', ten: 'Chuyển đổi đối với vị trí có nguy cơ tham nhũng cao, phù hợp vị trí việc làm',
    cachTinh: 'Đã rà soát và thực hiện đầy đủ: 1; đã rà soát nhưng chưa đầy đủ: 0,5; không rà soát hoặc bỏ sót: 0',
    minhChung: 'Báo cáo rà soát vị trí nguy cơ cao; danh sách người thuộc diện, đã chuyển đổi; quyết định chuyển đổi',
    donVi: { apDung: 'CA_HAI', fields: [
      { k: 'daRaSoat', t: 'Đơn vị đã rà soát, xác định vị trí có nguy cơ tham nhũng cao', type: YESNO, vbT: 'Văn bản rà soát, xác định vị trí có nguy cơ tham nhũng cao (báo cáo rà soát, danh mục vị trí)' },
      { k: 'nguoiPhai', t: 'Số người thuộc diện phải chuyển đổi', type: NUM },
      { k: 'nguoiDa', t: 'Số người đã chuyển đổi', type: NUM }] },
    canhBao: 'Mức điểm do công cụ gợi ý từ số liệu đơn vị; Thanh tra tỉnh xem xét, điều chỉnh nếu cần.' },
  { ma: 'B.1.6', dauMoi: ['SO02'], cap: 3, max: 5, rule: 'scale', ten: 'Kết quả thực hiện cải cách hành chính (PAR Index)',
    cachTinh: '(Điểm PAR Index của tỉnh / 100) × 5 — kết quả năm liền trước, công bố trong năm đánh giá',
    minhChung: 'Kết quả PAR Index do Bộ Nội vụ công bố (đầu mối: Sở Nội vụ)', scaleKey: 'diem', scaleCfg: 'THANG_PAR',
    tinh: [{ k: 'diem', t: 'Điểm PAR Index của tỉnh', type: NUM }] },
  { ma: 'B.1.7', dauMoi: ['SO06'], cap: 3, max: 7, rule: 'scale', ten: 'Ứng dụng khoa học công nghệ, chuyển đổi số trong quản lý (DTI)',
    cachTinh: '(Điểm DTI của UBND tỉnh / 1000) × 7 — kết quả năm liền trước, công bố trong năm đánh giá',
    minhChung: 'Kết quả DTI do Bộ KH&CN công bố (đầu mối: Sở KH&CN)', scaleKey: 'diem', scaleCfg: 'THANG_DTI',
    tinh: [{ k: 'diem', t: 'Điểm DTI của tỉnh', type: NUM }],
    canhBao: 'Cần kiểm tra thang điểm DTI cấp tỉnh thực tế được công bố (công thức giả định thang 1.000).' },
  { ma: 'B.1.8', dauMoi: ['SO01'], cap: 3, max: 2, rule: 'parts', ten: 'Thanh toán không dùng tiền mặt',
    cachTinh: 'Có kế hoạch hoặc văn bản lồng ghép: 1; có báo cáo kết quả: 1',
    minhChung: 'Kế hoạch/văn bản lồng ghép; báo cáo kết quả trong năm (đầu mối: Văn phòng UBND tỉnh, phối hợp NHNN Chi nhánh Khu vực 7)',
    tinh: [
      { k: 'keHoach', t: 'UBND tỉnh ban hành kế hoạch hoặc văn bản lồng ghép nội dung TTKDTM', type: YESNO, w: 1, vbT: 'Kế hoạch hoặc văn bản của UBND tỉnh lồng ghép nội dung thanh toán không dùng tiền mặt' },
      { k: 'baoCao', t: 'UBND tỉnh có báo cáo kết quả thực hiện', type: YESNO, w: 1, vbT: 'Báo cáo kết quả thực hiện thanh toán không dùng tiền mặt trong năm' }] },

  { ma: 'B.1.9', cap: 3, max: 8, ten: 'Kiểm soát tài sản, thu nhập' },
  { ma: 'B.1.9.1', cap: 4, max: 2, rule: 'dv', ten: 'Lập danh sách người có nghĩa vụ kê khai tài sản, thu nhập',
    cachTinh: '(Số sở, xã đã lập danh sách / Tổng số sở, xã phải lập) × 2', minhChung: 'Văn bản phê duyệt danh sách người có nghĩa vụ kê khai',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'B.1.9.2', cap: 4, max: 2, rule: 'dv', ten: 'Kết quả kê khai, công khai bản kê khai tài sản, thu nhập',
    cachTinh: '(Số sở, xã hoàn thành kê khai, công khai đúng quy định / Tổng số sở, xã phải thực hiện) × 2',
    minhChung: 'Báo cáo kết quả kê khai, công khai; hình thức công khai',
    donVi: { apDung: 'CA_HAI', kieu: 'dv' } },
  { ma: 'B.1.9.3', dauMoi: ['SO14'], cap: 4, max: 2, rule: 'parts', ten: 'Ban hành, phê duyệt kế hoạch xác minh tài sản, thu nhập trong năm',
    cachTinh: 'UBND tỉnh phê duyệt kế hoạch: 1; Thanh tra tỉnh ban hành kế hoạch tiến hành xác minh: 1',
    minhChung: 'Văn bản phê duyệt của UBND tỉnh; kế hoạch tiến hành xác minh',
    tinh: [
      { k: 'pheDuyet', t: 'UBND tỉnh phê duyệt kế hoạch xác minh TSTN trong năm', type: YESNO, w: 1, vbT: 'Văn bản UBND tỉnh phê duyệt kế hoạch xác minh TSTN trong năm' },
      { k: 'banHanh', t: 'Thanh tra tỉnh ban hành kế hoạch tiến hành xác minh trong năm', type: YESNO, w: 1, vbT: 'Kế hoạch tiến hành xác minh TSTN trong năm (Thanh tra tỉnh ban hành)' }] },
  { ma: 'B.1.9.4', dauMoi: ['SO14'], cap: 4, max: 2, rule: 'ratioTinh', ten: 'Kết quả xác minh tài sản, thu nhập trong năm',
    cachTinh: '(Số người được xác minh đã có kết luận / Tổng số người được xác minh trong năm) × 2',
    minhChung: 'Kết luận xác minh; danh sách người được xác minh (không tính hồ sơ đang xác minh)',
    num: 'coKetLuan', den: 'xacMinh', zero: 'warn0',
    tinh: [
      { k: 'xacMinh', t: 'Tổng số người được xác minh trong năm', type: NUM },
      { k: 'coKetLuan', t: 'Số người đã có kết luận xác minh', type: NUM }] },

  { ma: 'B.1.10', cap: 3, max: 6, ten: 'Trách nhiệm của người đứng đầu' },
  { ma: 'B.1.10.1', dauMoi: ['SO01'], cap: 4, max: 1, rule: 'ratioTinh', ten: 'Chỉ đạo của Chủ tịch UBND tỉnh xử lý tố cáo, kiến nghị, phản ánh về TNLPTC',
    cachTinh: '(Số vụ việc được Chủ tịch UBND tỉnh có văn bản chỉ đạo / Tổng số vụ việc gửi tới Chủ tịch UBND tỉnh) × 1; không có vụ việc: 1',
    minhChung: 'Văn bản chỉ đạo; tổng hợp vụ việc (đầu mối: Văn phòng UBND tỉnh)',
    num: 'chiDao', den: 'tongVu', zero: 'max',
    tinh: [
      { k: 'tongVu', t: 'Tổng số vụ việc tố cáo, kiến nghị, phản ánh về TNLPTC gửi tới Chủ tịch UBND tỉnh', type: NUM },
      { k: 'chiDao', t: 'Số vụ việc Chủ tịch UBND tỉnh có văn bản chỉ đạo xử lý', type: NUM }] },
  { ma: 'B.1.10.2', dauMoi: ['SO01'], cap: 4, max: 2, rule: 'scale', ten: 'Tiếp công dân của Chủ tịch UBND tỉnh theo quy định',
    cachTinh: '(Số tháng tiếp công dân / 12) × 2', minhChung: 'Thông báo, lịch, biên bản tiếp công dân; văn bản ủy quyền (nếu có)',
    scaleKey: 'soThang', scaleFixed: 12,
    tinh: [{ k: 'soThang', t: 'Số tháng Chủ tịch UBND tỉnh tiếp công dân theo quy định', type: NUM }],
    canhBao: 'Chưa rõ có tính tháng do người được ủy quyền tiếp thay hay không.' },
  { ma: 'B.1.10.3', cap: 4, max: 1, rule: 'tcd', ten: 'Tiếp công dân của người đứng đầu cơ quan chuyên môn thuộc UBND tỉnh có chức năng tiếp công dân',
    cachTinh: '(Số người đứng đầu tiếp dân đầy đủ theo quy định / Tổng số người đứng đầu CQCM có chức năng tiếp công dân) × 1',
    minhChung: 'Thông báo, lịch, biên bản thể hiện số tháng tiếp công dân',
    donVi: { apDung: 'CQCM', fields: [
      { k: 'soThang', t: 'Số tháng người đứng đầu tiếp công dân đầy đủ theo quy định (trong kỳ 15/12/2025 - 14/12/2026)', type: NUM },
      { k: 'vanBan', t: 'Thông báo, lịch, biên bản, sổ tiếp công dân (số, ký hiệu, ngày, cơ quan ban hành, trích yếu; mỗi văn bản một dòng)', type: TEXT, long: true }] },
    canhBao: 'Tính theo số cơ quan chuyên môn có minh chứng tiếp công dân (thông báo, lịch, biên bản, sổ tiếp công dân).' },
  { ma: 'B.1.10.4', cap: 4, max: 2, rule: 'tcd', ten: 'Tiếp công dân của Chủ tịch UBND cấp xã theo Luật Tiếp công dân',
    cachTinh: '(Số Chủ tịch UBND xã tiếp dân đầy đủ theo điểm c khoản 2 Điều 15 Luật Tiếp công dân / Tổng số Chủ tịch UBND xã) × 2',
    minhChung: 'Thông báo, lịch, biên bản thể hiện số tháng, số ngày tiếp công dân',
    donVi: { apDung: 'XA', fields: [
      { k: 'soThang', t: 'Số tháng Chủ tịch UBND xã tiếp công dân đủ số ngày theo quy định (trong kỳ 15/12/2025 - 14/12/2026)', type: NUM },
      { k: 'soNgay', t: 'Tổng số ngày Chủ tịch UBND xã trực tiếp tiếp công dân', type: NUM },
      { k: 'vanBan', t: 'Thông báo, lịch, biên bản, sổ tiếp công dân (số, ký hiệu, ngày, cơ quan ban hành, trích yếu; mỗi văn bản một dòng)', type: TEXT, long: true }] },
    canhBao: 'Tính theo số xã, phường có minh chứng tiếp công dân (thông báo, lịch, biên bản, sổ tiếp công dân).' },
  { ma: 'B.1.11', dauMoi: ['SO03'], cap: 3, max: 2, rule: 'ratioTinh', ten: 'Cập nhật cơ sở dữ liệu quốc gia về tiết kiệm, chống lãng phí',
    cachTinh: '(Số thông tin đã cập nhật / Tổng số thông tin phải cập nhật theo quy định) × 2',
    minhChung: 'Danh mục thông tin phải cập nhật, đã cập nhật; thời hạn cập nhật (đầu mối: Sở Tài chính)',
    num: 'da', den: 'phai', zero: 'warn0',
    tinh: [
      { k: 'phai', t: 'Tổng số thông tin phải cập nhật', type: NUM },
      { k: 'da', t: 'Số thông tin đã cập nhật', type: NUM }] },

  { ma: 'B.2', cap: 2, max: 5, ten: 'Phòng ngừa tham nhũng, lãng phí, tiêu cực trong doanh nghiệp, tổ chức khu vực ngoài nhà nước' },
  { ma: 'B.2.1', dauMoi: ['SO01'], cap: 3, max: 1, rule: 'parts', ten: 'Thực hiện quy tắc ứng xử, cơ chế kiểm soát nội bộ',
    cachTinh: 'Trong năm UBND tỉnh có văn bản hướng dẫn, đôn đốc, yêu cầu báo cáo: 1; không: 0', minhChung: 'Văn bản của UBND tỉnh',
    tinh: [{ k: 'co', t: 'UBND tỉnh có văn bản hướng dẫn, đôn đốc, yêu cầu báo cáo', type: YESNO, w: 1, vbT: 'Văn bản UBND tỉnh hướng dẫn, đôn đốc, yêu cầu báo cáo kết quả thực hiện quy tắc ứng xử, cơ chế kiểm soát nội bộ trong doanh nghiệp, tổ chức khu vực ngoài nhà nước' }] },
  { ma: 'B.2.2', dauMoi: ['SO01'], cap: 3, max: 1, rule: 'parts', ten: 'Thực hiện các biện pháp công khai, minh bạch',
    cachTinh: 'Trong năm UBND tỉnh có văn bản hướng dẫn, đôn đốc, yêu cầu báo cáo: 1; không: 0', minhChung: 'Văn bản của UBND tỉnh',
    tinh: [{ k: 'co', t: 'UBND tỉnh có văn bản hướng dẫn, đôn đốc, yêu cầu báo cáo', type: YESNO, w: 1, vbT: 'Văn bản UBND tỉnh hướng dẫn, đôn đốc, yêu cầu báo cáo kết quả thực hiện các biện pháp công khai, minh bạch trong doanh nghiệp, tổ chức khu vực ngoài nhà nước' }] },
  { ma: 'B.2.3', dauMoi: ['SO01'], cap: 3, max: 1, rule: 'parts', ten: 'Thực hiện kiểm soát xung đột lợi ích',
    cachTinh: 'Trong năm UBND tỉnh có văn bản hướng dẫn, đôn đốc, yêu cầu báo cáo: 1; không: 0', minhChung: 'Văn bản của UBND tỉnh',
    tinh: [{ k: 'co', t: 'UBND tỉnh có văn bản hướng dẫn, đôn đốc, yêu cầu báo cáo', type: YESNO, w: 1, vbT: 'Văn bản UBND tỉnh hướng dẫn, đôn đốc, yêu cầu báo cáo kết quả kiểm soát xung đột lợi ích trong doanh nghiệp, tổ chức khu vực ngoài nhà nước' }] },
  { ma: 'B.2.4', dauMoi: ['SO01'], cap: 3, max: 2, rule: 'ratioTinh', ten: 'Trách nhiệm người đứng đầu trong việc báo cáo kết quả áp dụng biện pháp phòng ngừa tham nhũng',
    cachTinh: '(Số DN, tổ chức ngoài nhà nước có văn bản báo cáo / Tổng số DN, tổ chức có nghĩa vụ báo cáo) × 2',
    minhChung: 'Danh sách DN, tổ chức có nghĩa vụ báo cáo và đã báo cáo',
    num: 'daBaoCao', den: 'coNghiaVu', zero: 'warn0',
    tinh: [
      { k: 'coNghiaVu', t: 'Tổng số DN, tổ chức ngoài nhà nước có nghĩa vụ báo cáo', type: NUM },
      { k: 'daBaoCao', t: 'Số DN, tổ chức đã có văn bản báo cáo', type: NUM }],
    canhBao: 'Không lấy toàn bộ doanh nghiệp trên địa bàn làm mẫu số; cần căn cứ xác định "có nghĩa vụ báo cáo".' },

  // ======================= C =======================
  { ma: 'C', cap: 1, max: 17, ten: 'TIÊU CHÍ ĐÁNH GIÁ VIỆC PHÁT HIỆN THAM NHŨNG, LÃNG PHÍ, TIÊU CỰC' },
  { ma: 'C.1', cap: 2, max: 8, rule: 'c1', ten: 'Phát hiện qua giám sát, thanh tra, kiểm tra',
    cachTinh: '(Cuộc kiểm tra phát hiện / Tổng cuộc kiểm tra) × 2 + (Cuộc giám sát phát hiện / Tổng cuộc giám sát) × 1 + (Cuộc thanh tra phát hiện / Tổng cuộc thanh tra) × 5',
    minhChung: 'Danh sách các cuộc; kết luận, báo cáo kết quả (không tính cuộc chỉ có kiến nghị chung)',
    donVi: { apDung: 'CA_HAI', fields: [
      { k: 'ttTong', t: 'Tổng số cuộc thanh tra đã kết thúc (có kết luận) trong kỳ', type: NUM, chiMa: ['SO14'] },
      { k: 'ttPhatHien', t: 'Số cuộc thanh tra phát hiện tham nhũng, lãng phí, tiêu cực', type: NUM, chiMa: ['SO14'] },
      { k: 'ktTong', t: 'Tổng số cuộc kiểm tra đơn vị đã thực hiện, đã kết thúc trong kỳ', type: NUM },
      { k: 'ktPhatHien', t: 'Số cuộc kiểm tra phát hiện tham nhũng, lãng phí, tiêu cực', type: NUM },
      { k: 'gsTong', t: 'Tổng số cuộc giám sát đơn vị đã thực hiện trong kỳ (không có thì ghi 0)', type: NUM },
      { k: 'gsPhatHien', t: 'Số cuộc giám sát phát hiện tham nhũng, lãng phí, tiêu cực', type: NUM }] } },
  { ma: 'C.2', cap: 2, max: 3, rule: 'c2', ten: 'Phát hiện qua phản ánh, tố cáo, báo cáo hoặc thông tin dưới hình thức khác',
    cachTinh: '(Vụ phát hiện qua tin phản ánh / Tổng tin phản ánh) × 1 + (Vụ phát hiện qua đơn tố cáo / Tổng đơn tố cáo) × 1 + (Vụ phát hiện qua báo cáo / Tổng báo cáo) × 1',
    minhChung: 'Báo cáo kết quả xử lý phản ánh, giải quyết tố cáo; phân loại đúng nguồn, không tính trùng',
    donVi: { apDung: 'CA_HAI', fields: [
      { k: 'tinTong', t: 'Tổng số tin phản ánh liên quan TNLPTC', type: NUM },
      { k: 'tinPhatHien', t: 'Số vụ phát hiện qua tin phản ánh', type: NUM },
      { k: 'donTong', t: 'Tổng số đơn tố cáo liên quan TNLPTC', type: NUM },
      { k: 'donPhatHien', t: 'Số vụ phát hiện qua đơn tố cáo', type: NUM },
      { k: 'bcTong', t: 'Tổng số báo cáo liên quan TNLPTC', type: NUM },
      { k: 'bcPhatHien', t: 'Số vụ phát hiện qua báo cáo', type: NUM }] } },
  { ma: 'C.3', dauMoi: ['SO14'], cap: 2, max: 6, rule: 'ratioTinh', ten: 'Phát hiện qua điều tra',
    cachTinh: '(Số vụ án TNLPTC được khởi tố điều tra / Tổng số tố giác, tin báo tội phạm, kiến nghị khởi tố về TNLPTC) × 6',
    minhChung: 'Số liệu của cơ quan điều tra (Thanh tra tỉnh phối hợp Công an tỉnh lấy số liệu và nhập)',
    num: 'khoiTo', den: 'toGiac', zero: 'warn0',
    tinh: [
      { k: 'toGiac', t: 'Tổng số tố giác, tin báo tội phạm, kiến nghị khởi tố về TNLPTC', type: NUM },
      { k: 'khoiTo', t: 'Số vụ án TNLPTC được khởi tố điều tra', type: NUM }] },

  // ======================= D =======================
  { ma: 'D', cap: 1, max: 10, ten: 'TIÊU CHÍ ĐÁNH GIÁ VIỆC XỬ LÝ VÀ THU HỒI TÀI SẢN' },
  { ma: 'D.1', cap: 2, max: 2, rule: 'ratioSum', ten: 'Xử lý trách nhiệm người đứng đầu, cấp phó để xảy ra TNLPTC',
    cachTinh: '(Số cơ quan đã xử lý trách nhiệm người đứng đầu, cấp phó / Tổng số cơ quan, đơn vị để xảy ra TNLPTC) × 2',
    minhChung: 'Quyết định xử lý (phân biệt số cơ quan với số cá nhân)',
    num: 'daXuLy', den: 'deXayRa', zero: 'warn0',
    donVi: { apDung: 'CA_HAI', fields: [
      { k: 'deXayRa', t: 'Số cơ quan, đơn vị (thuộc phạm vi quản lý) để xảy ra TNLPTC', type: NUM },
      { k: 'daXuLy', t: 'Số cơ quan đã xử lý trách nhiệm người đứng đầu, cấp phó', type: NUM }] } },
  { ma: 'D.2', cap: 2, max: 2, rule: 'ratioSum', ten: 'Xử lý kỷ luật, xử phạt hành chính tổ chức, cá nhân vi phạm',
    cachTinh: '(Số tổ chức, cá nhân đã xử lý kỷ luật, XPHC / Tổng số tổ chức, cá nhân để xảy ra TNLPTC) × 2',
    minhChung: 'Quyết định kỷ luật, xử phạt hành chính',
    num: 'daXuLy', den: 'viPham', zero: 'warn0',
    donVi: { apDung: 'CA_HAI', fields: [
      { k: 'viPham', t: 'Số tổ chức, cá nhân để xảy ra TNLPTC (do đơn vị phát hiện)', type: NUM },
      { k: 'daXuLy', t: 'Số tổ chức, cá nhân đã bị xử lý kỷ luật, xử phạt hành chính', type: NUM }] } },
  { ma: 'D.3', dauMoi: ['SO14'], cap: 2, max: 2, rule: 'ratioTinh', ten: 'Xử lý hình sự người có hành vi TNLPTC',
    cachTinh: '(Số người bị đề nghị truy tố / Tổng số người bị khởi tố trong các vụ án TNLPTC) × 2 (tính theo số người)',
    minhChung: 'Số liệu cơ quan điều tra (Thanh tra tỉnh phối hợp Công an tỉnh, VKSND tỉnh lấy số liệu và nhập)',
    num: 'deNghiTruyTo', den: 'khoiTo', zero: 'warn0',
    tinh: [
      { k: 'khoiTo', t: 'Tổng số người bị khởi tố trong các vụ án TNLPTC', type: NUM },
      { k: 'deNghiTruyTo', t: 'Số người bị cơ quan điều tra đề nghị truy tố', type: NUM }] },
  { ma: 'D.4', cap: 2, max: 4, ten: 'Thu hồi tài sản tham nhũng, lãng phí, tiêu cực' },
  { ma: 'D.4.1', cap: 3, max: 2, rule: 'd41', ten: 'Tổng số tiền, tài sản phải thu hồi và kết quả thu hồi',
    cachTinh: '(Tổng tiền, tài sản đã thu hồi / Tổng tiền, tài sản phải thu hồi) × 2 — toàn tỉnh (= D.4.2 + D.4.3, tính tự động)',
    minhChung: 'Danh mục theo vụ việc: phải thu, đã thu, phương thức, nguồn xác nhận',
    canhBao: 'Tránh tính trùng giữa các giai đoạn (thanh tra - điều tra - thi hành án).' },
  { ma: 'D.4.2', cap: 3, max: 1, rule: 'd42', ten: 'Thu hồi bằng biện pháp hành chính',
    cachTinh: '(Tiền, tài sản đã thu hồi qua giám sát, kiểm tra, thanh tra, giải quyết tố cáo, phản ánh / Tổng tiền, tài sản TNLPTC phát hiện qua các hoạt động đó) × 1',
    minhChung: 'Kết luận, quyết định thu hồi; chứng từ nộp tiền',
    donVi: { apDung: 'CA_HAI', fields: [
      { k: 'phai', t: 'Tiền, tài sản TNLPTC phát hiện phải thu hồi (đồng)', type: MONEY },
      { k: 'da', t: 'Tiền, tài sản đã thu hồi (đồng)', type: MONEY }] } },
  { ma: 'D.4.3', canhBao: 'Số liệu điều tra (Công an tỉnh) và thi hành án (Cơ quan THADS): đối chiếu theo vụ việc, không tính trùng một khoản tiền ở cả hai giai đoạn.', dauMoi: ['SO14'], cap: 3, max: 1, rule: 'ratioTinh', ten: 'Thu hồi bằng biện pháp tư pháp',
    cachTinh: '(Tiền, tài sản đã thu hồi qua điều tra, thi hành án / Tổng tiền, tài sản TNLPTC phát hiện qua điều tra, thi hành án) × 1',
    minhChung: 'Số liệu cơ quan điều tra, thi hành án dân sự',
    num: 'da', den: 'phai', zero: 'warn0',
    tinh: [
      { k: 'phai', t: 'Tiền, tài sản phát hiện qua điều tra, thi hành án (đồng)', type: MONEY },
      { k: 'da', t: 'Tiền, tài sản đã thu hồi (đồng)', type: MONEY }] },

  // ======================= Đ (điểm cộng) =======================
  { ma: 'Đ', cap: 1, max: 4, ten: 'ĐIỂM CỘNG', bonus: true },
  { ma: 'Đ.1', dauMoi: ['SO14'], cap: 2, max: 2, rule: 'parts', ten: 'Thu hồi tiền, tài sản TNLPTC qua thi hành án vượt chỉ tiêu Bộ Tư pháp giao',
    cachTinh: 'Tỷ lệ thu hồi vượt chỉ tiêu: +2', minhChung: 'Văn bản giao chỉ tiêu; số liệu xác nhận của cơ quan thi hành án',
    tinh: [{ k: 'co', t: 'Tỷ lệ thu hồi qua thi hành án vượt chỉ tiêu Bộ Tư pháp giao', type: YESNO, w: 2, vbT: 'Văn bản, số liệu của Cơ quan Thi hành án dân sự tỉnh xác nhận tỷ lệ thu hồi vượt chỉ tiêu Bộ Tư pháp giao (không vượt thì để trống)' }] },
  { ma: 'Đ.2', cap: 2, max: 2, rule: 'parts', ten: 'Chủ động kiến nghị cơ quan có thẩm quyền xử lý hành vi TNLPTC',
    cachTinh: 'Có văn bản kiến nghị cụ thể: +2', minhChung: 'Văn bản kiến nghị (báo cáo tình hình chung không thay thế)',
    donVi: { apDung: 'CA_HAI', tuyChon: true, fields: [
      { k: 'co', t: 'Đơn vị có văn bản chủ động kiến nghị cơ quan có thẩm quyền xử lý hành vi TNLPTC trong kỳ', type: YESNO, vbT: 'Văn bản đơn vị chủ động kiến nghị cơ quan có thẩm quyền xử lý hành vi TNLPTC trong kỳ' }] },
    tinh: [{ k: 'co', t: 'Có văn bản kiến nghị cơ quan có thẩm quyền xử lý (UBND tỉnh hoặc sở, xã)', vb: true, type: YESNO, w: 2 }] },

  // ======================= E (điểm trừ) =======================
  { ma: 'E', cap: 1, max: 9, ten: 'ĐIỂM TRỪ', penalty: true },
  { ma: 'E.1', cap: 2, max: 2, rule: 'level', ten: 'Không thực hiện hoặc chậm nộp báo cáo công tác PCTNLPTC, báo cáo tự đánh giá',
    cachTinh: 'Không nộp: trừ 2; chậm nộp: trừ 1', minhChung: 'Thời gian gửi báo cáo',
    tinh: [{ k: 'muc', t: 'Mức trừ', type: SELECT, options: [{ v: 0, t: 'Nộp đúng hạn (0)' }, { v: 1, t: 'Chậm nộp (trừ 1)' }, { v: 2, t: 'Không nộp (trừ 2)' }] }] },
  { ma: 'E.2', cap: 2, max: 2, rule: 'parts', ten: 'Cung cấp hồ sơ, tài liệu minh chứng không chính xác',
    cachTinh: 'Bị cơ quan khác phát hiện: trừ 2', minhChung: 'Khi các cơ quan khác phát hiện',
    tinh: [{ k: 'co', t: 'Có cơ quan khác phát hiện cung cấp tài liệu không chính xác', type: YESNO, w: 2 }] },
  { ma: 'E.3', cap: 2, max: 3, rule: 'parts', ten: 'Báo cáo không có TNLPTC nhưng cơ quan có thẩm quyền khác phát hiện',
    cachTinh: 'Có vụ việc bị cơ quan khác phát hiện: trừ 3', minhChung: 'Khi các cơ quan khác phát hiện',
    tinh: [{ k: 'co', t: 'Có vụ việc bị cơ quan khác phát hiện', type: YESNO, w: 3 }] },
  { ma: 'E.4', cap: 2, max: 2, rule: 'level', ten: 'Người đứng đầu, cấp phó của UBND tỉnh, cấp trực thuộc, cấp xã bị xử lý do TNLPTC được cơ quan khác phát hiện',
    cachTinh: 'Hình sự/khai trừ: trừ 2; cách chức: trừ 1,5; cảnh cáo: trừ 1; khiển trách: trừ 0,5 (lấy mức cao nhất)',
    minhChung: 'Danh sách người bị xử lý theo từng mức',
    tinh: [{ k: 'muc', t: 'Mức cao nhất', type: SELECT, options: [
      { v: 0, t: 'Không có (0)' }, { v: 0.5, t: 'Khiển trách (trừ 0,5)' }, { v: 1, t: 'Cảnh cáo (trừ 1)' },
      { v: 1.5, t: 'Cách chức (trừ 1,5)' }, { v: 2, t: 'Xử lý hình sự hoặc khai trừ (trừ 2)' }] }] }
];

/** Các ô dùng chung (Lưu ý 3) - Thanh tra tỉnh nhập ở NHAP_TINH với mã CHUNG. */
var PACA_TINH_CHUNG = [
  { k: 'benNgoaiPhatHien', t: 'Lưu ý 3: có vụ việc TNLPTC trên địa bàn do cơ quan ngoài địa phương phát hiện (Có -> C.1, C.2, D.4.2 không có điểm)', type: YESNO }
];

if (typeof module !== 'undefined') module.exports = { PACA_CRITERIA: PACA_CRITERIA, PACA_TINH_CHUNG: PACA_TINH_CHUNG };
