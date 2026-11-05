/**
 * Hướng dẫn hiển thị cho ĐƠN VỊ trên trang nhập liệu và cho Tổ công tác đánh giá ở thẻ "Số liệu cấp tỉnh".
 * Viết theo cột "Yêu cầu tài liệu, số liệu" của Phụ lục II Quyết định 47/2026/QĐ-TTg (chuyển sang mức một đơn vị),
 * các lỗi minh chứng thường gặp và Phụ biểu hướng dẫn của Thanh tra tỉnh (phần "Căn cứ" lấy
 * nguyên văn từ gas/02_HuongDan.js). Người nhập đọc là làm được, không phải mở lại Quyết định 47.
 *   qd  : QĐ 47 yêu cầu gì (ở mức đơn vị)
 *   lam : cách nhập các ô số liệu (tiêu chí kiểu văn bản dùng câu chung)
 *   tl  : văn bản, tài liệu cần ghi và tải lên (kèm dạng văn bản ví dụ)
 *   loi : không dùng / lỗi minh chứng thường gặp
 *   luuY: lưu ý khác
 */

var PACA_HD_DON_VI = {
  'A.2.1': {
    qd: 'Đơn vị có chức năng xây dựng, hoàn thiện chính sách, pháp luật phải có văn bản xây dựng, hoàn thiện chính sách, pháp luật để PCTNLPTC và báo cáo kết quả thực hiện.',
    tl: ['Văn bản do đơn vị chủ trì xây dựng, tham mưu ban hành hoặc kiến nghị sửa đổi, bổ sung chính sách, pháp luật có nội dung PCTNLPTC (tờ trình, dự thảo, văn bản góp ý, kiến nghị) ban hành trong kỳ',
      'Báo cáo kết quả thực hiện của đơn vị (có thể là mục riêng trong báo cáo công tác PCTNLPTC năm 2026)'],
    loi: 'Không dùng kế hoạch PCTNLPTC chung thay cho văn bản xây dựng, hoàn thiện chính sách, pháp luật.',
    luuY: 'Đơn vị không có chức năng, nhiệm vụ xây dựng, tham mưu chính sách, pháp luật: đánh dấu "Không thuộc diện" và ghi lý do.' },
  'A.2.2': {
    qd: 'Đơn vị có văn bản báo cáo kết quả kiểm tra, rà soát, hệ thống hóa VBQPPL.',
    tl: ['Báo cáo kết quả kiểm tra, rà soát, hệ thống hóa VBQPPL của đơn vị (kèm danh mục văn bản đã rà soát, văn bản kiến nghị sửa đổi, bãi bỏ nếu có)',
      'Kế hoạch hoặc văn bản triển khai rà soát của đơn vị (nếu có), ví dụ kế hoạch triển khai Kế hoạch 123/KH-UBND'],
    loi: 'Nộp kế hoạch PCTN thay cho báo cáo kết quả rà soát: không được tính.',
    luuY: 'Theo Kế hoạch 123/KH-UBND, báo cáo chính thức gửi trước ngày 15/11/2026.' },
  'A.2.3.1': {
    qd: 'Đơn vị ban hành Chương trình thực hành tiết kiệm, chống lãng phí năm 2026.',
    tl: ['Quyết định ban hành Chương trình THTK, CLP năm 2026 của đơn vị (hoặc chương trình, kế hoạch THTK, CLP năm 2026)'],
    loi: 'Không dùng công văn đôn đốc hoặc chương trình của năm trước.' },
  'A.2.3.2': {
    qd: 'Đơn vị có báo cáo kết quả thực hiện Chương trình THTK, CLP; báo cáo nêu các nhiệm vụ đã hoàn thành đúng hạn và tài liệu chứng minh kết quả.',
    tl: ['Báo cáo kết quả thực hiện Chương trình THTK, CLP năm 2026 của đơn vị (số liệu trong kỳ đánh giá), có nêu nhiệm vụ đã hoàn thành đúng hạn',
      'Tài liệu chứng minh kết quả nêu trong báo cáo (nếu có)'],
    loi: 'Không dùng báo cáo 6 tháng, 9 tháng thay cho báo cáo năm.',
    luuY: 'Trước 20/12/2026 gửi kết quả trong kỳ đánh giá; báo cáo năm gửi Sở Tài chính trước 15/01/2027 theo Quyết định 210/QĐ-UBND.' },
  'A.2.4.1': {
    loi: 'Chỉ nộp kế hoạch PCTN chung không có mục tuyên truyền: kế hoạch phải có nội dung tuyên truyền, PBGDPL về PCTNLPTC.',
    qd: 'Đơn vị ban hành kế hoạch tuyên truyền, phổ biến, giáo dục pháp luật về PCTNLPTC năm 2026.',
    tl: ['Kế hoạch tuyên truyền, PBGDPL về PCTNLPTC năm 2026 của đơn vị; hoặc kế hoạch công tác PCTNLPTC năm 2026 có mục riêng về tuyên truyền, PBGDPL (ghi rõ mục ở ô giải trình)'] },
  'A.2.4.2': {
    loi: 'Báo cáo PCTN chung không có số liệu tuyên truyền (số buổi, hình thức, số người) thì chưa chứng minh được kết quả.',
    qd: 'Đơn vị có báo cáo kết quả tuyên truyền, PBGDPL về PCTNLPTC; báo cáo nêu các nhiệm vụ đã hoàn thành đúng hạn và tài liệu chứng minh.',
    tl: ['Báo cáo kết quả tuyên truyền, PBGDPL về PCTNLPTC năm 2026 (hoặc báo cáo công tác PCTNLPTC năm 2026 có mục riêng về kết quả tuyên truyền: số buổi, hình thức, số người tham dự)',
      'Tài liệu chứng minh: giấy mời, thông báo hội nghị tuyên truyền, đường dẫn tin bài (nếu có)'] },
  'A.2.5': {
    loi: 'Không dùng báo cáo PBGDPL hoặc kế hoạch PCTN chung cho tiêu chí này.',
    qd: 'Đơn vị có chức năng kiểm tra, theo dõi thi hành VBQPPL có báo cáo kết quả thực hiện; báo cáo nêu nhiệm vụ đã hoàn thành đúng hạn và tài liệu chứng minh.',
    tl: ['Kế hoạch theo dõi tình hình thi hành pháp luật (hoặc kiểm tra văn bản) năm 2026 của đơn vị',
      'Báo cáo kết quả theo dõi tình hình thi hành pháp luật, kiểm tra văn bản năm 2026'],
    luuY: 'Đơn vị không có chức năng này: đánh dấu "Không thuộc diện" và ghi lý do.' },
  'B.1.1.1': {
    loi: 'Chỉ nộp kế hoạch kiểm soát TTHC, cải cách hành chính, thiếu bằng chứng đã công khai: cần thông báo, ảnh niêm yết tại bộ phận một cửa hoặc đường dẫn Cổng dịch vụ công.',
    qd: 'Đơn vị thực hiện công khai thủ tục hành chính thuộc thẩm quyền theo quy định.',
    tl: ['Thông báo niêm yết, văn bản công khai TTHC tại bộ phận một cửa hoặc trên trang thông tin điện tử; quyết định công bố danh mục TTHC, quy trình nội bộ (nếu có trong kỳ)',
      'Báo cáo kết quả kiểm soát, công khai TTHC trong năm'],
    luuY: 'Ghi đường dẫn trang thông tin điện tử nơi công khai.' },
  'B.1.1.2': {
    qd: 'Liệt kê các nội dung phải công khai và đã công khai về THTK, CLP.',
    lam: 'Ghi số nội dung phải công khai và số nội dung đã công khai theo pháp luật về THTK, CLP (ví dụ: chương trình THTK, CLP; kết quả THTK, CLP; kinh phí tiết kiệm chi thường xuyên...).',
    tl: ['Danh mục các nội dung phải và đã công khai (ghi ở ô văn bản hoặc ô giải trình)', 'Văn bản, thông báo công khai từng nội dung; đường dẫn công khai'] },
  'B.1.1.3': {
    qd: 'Đơn vị công khai quy tắc ứng xử của người có chức vụ, quyền hạn.',
    tl: ['Văn bản ban hành hoặc triển khai quy tắc ứng xử của đơn vị và văn bản/hình thức công khai (niêm yết, đăng trang thông tin điện tử) trong kỳ',
      'Báo cáo kết quả thực hiện công khai'],
    loi: 'Chỉ nộp báo cáo PCTN chung, không có văn bản công khai: cần tải văn bản công khai cụ thể.' },
  'B.1.1.4': {
    qd: 'Đơn vị có tuyển dụng, bổ nhiệm trong kỳ phải công khai theo quy định (thông báo tuyển dụng, quyết định phê duyệt kết quả tuyển dụng công khai trên cổng thông tin điện tử).',
    tl: ['Thông báo tuyển dụng; quyết định phê duyệt kết quả tuyển dụng đã đăng trên cổng/trang thông tin điện tử',
      'Văn bản công khai quy trình bổ nhiệm, bổ nhiệm lại (nếu có bổ nhiệm)'],
    loi: 'Giấy mời hội nghị, thông báo kết luận của tập thể lãnh đạo không thay được văn bản công khai.',
    luuY: 'Trong kỳ không tuyển dụng, bổ nhiệm: đánh dấu "Không thuộc diện" và ghi "không phát sinh".' },
  'B.1.1.5': {
    loi: 'Quyết định công khai dự toán là minh chứng của tiêu chí này, không nộp vào tiêu chí tuyển dụng, bổ nhiệm; không dùng dự toán của năm sau.',
    qd: 'Đơn vị công khai ngân sách theo quy định.',
    tl: ['Quyết định công bố công khai dự toán ngân sách năm 2026 (và dự toán điều chỉnh, bổ sung nếu có)', 'Quyết định công khai quyết toán ngân sách; báo cáo công khai tình hình thực hiện dự toán trong kỳ; đường dẫn công khai'] },
  'B.1.1.6': {
    qd: 'Đơn vị công khai việc quản lý, sử dụng tài sản công theo quy định.',
    tl: ['Văn bản, báo cáo công khai tình hình quản lý, sử dụng tài sản công trong kỳ; đường dẫn hoặc biên bản niêm yết'],
    loi: 'Quy chế quản lý tài sản công ban hành từ các năm trước chỉ là quy chế, không phải văn bản công khai trong kỳ.' },
  'B.1.1.7': {
    qd: 'UBND xã, phường công khai quy hoạch xây dựng, quy hoạch sử dụng đất, kế hoạch sử dụng đất theo quy định.',
    tl: ['Văn bản triển khai công khai quy hoạch, kế hoạch sử dụng đất', 'Biên bản niêm yết, hình ảnh niêm yết tại trụ sở; đường dẫn đăng tải', 'Báo cáo kết quả công khai'] },
  'B.1.1.8': {
    qd: 'Liệt kê các nội dung phải và đã công khai trong quá trình xây dựng VBQPPL (đăng tải dự thảo, lấy ý kiến).',
    lam: 'Đơn vị chủ trì soạn thảo VBQPPL ghi số dự thảo phải công khai và số đã đăng tải, lấy ý kiến. Trong kỳ không chủ trì soạn thảo VBQPPL: ghi 0 và nêu rõ ở ô giải trình.',
    tl: ['Danh mục dự thảo VBQPPL đã đăng tải lấy ý kiến, kèm đường dẫn', 'Văn bản lấy ý kiến góp ý dự thảo'] },
  'B.1.2.1': {
    qd: 'Đơn vị ban hành văn bản triển khai tổ chức rà soát xung đột lợi ích.',
    tl: ['Kế hoạch hoặc văn bản riêng triển khai rà soát, kiểm soát xung đột lợi ích năm 2026 của đơn vị'],
    loi: 'Chỉ nộp kế hoạch PCTN chung mà không có mục rà soát xung đột lợi ích: chưa đáp ứng. Nếu dùng kế hoạch chung thì kế hoạch phải có mục rà soát xung đột lợi ích, ghi rõ mục đó ở ô giải trình.' },
  'B.1.2.2': {
    qd: 'Đơn vị có báo cáo kết quả rà soát xung đột lợi ích.',
    tl: ['Báo cáo kết quả rà soát xung đột lợi ích (riêng, hoặc mục riêng trong báo cáo công tác PCTN năm 2026 — ghi rõ mục ở ô giải trình)'] },
  'B.1.2.3': {
    qd: 'Liệt kê chi tiết các vụ xung đột lợi ích phát hiện qua rà soát và tình trạng xử lý.',
    lam: 'Ghi số vụ xung đột lợi ích phát hiện trong kỳ và số vụ đã xử lý xong đến ngày 14/12/2026. Không phát hiện: ghi 0.',
    tl: ['Danh sách vụ việc xung đột lợi ích (tóm tắt, đã/chưa xử lý; không ghi họ tên)', 'Văn bản xử lý từng vụ (khi có)'],
    loi: 'Không đưa vụ án hình sự hoặc văn bản về THTK vào tiêu chí này.' },
  'B.1.3.1': {
    qd: 'Đơn vị ban hành văn bản để kiểm tra việc thực hiện định mức, chế độ, tiêu chuẩn.',
    tl: ['Kế hoạch hoặc quyết định tự kiểm tra nội bộ việc thực hiện định mức, chế độ, tiêu chuẩn năm 2026'],
    loi: 'Không có kế hoạch kiểm tra riêng, chỉ nộp quy chế chi tiêu nội bộ, chương trình THTK: không đáp ứng.' },
  'B.1.3.2': {
    qd: 'Đơn vị có báo cáo kết quả kiểm tra việc thực hiện định mức, chế độ, tiêu chuẩn; nêu nhiệm vụ đã hoàn thành và tài liệu chứng minh.',
    tl: ['Thông báo kết luận hoặc biên bản kiểm tra; báo cáo kết quả kiểm tra việc thực hiện định mức, chế độ, tiêu chuẩn năm 2026'] },
  'B.1.4': {
    loi: 'Chỉ nộp báo cáo PCTN chung: cần báo cáo (hoặc mục riêng) nêu cụ thể việc thực hiện quy tắc ứng xử, kiểm tra, xử lý vi phạm (nếu có).',
    qd: 'Đơn vị có báo cáo việc thực hiện quy tắc ứng xử; nêu nhiệm vụ đã hoàn thành và tài liệu chứng minh.',
    tl: ['Báo cáo kết quả thực hiện quy tắc ứng xử năm 2026 (riêng, hoặc mục riêng trong báo cáo PCTN năm — ghi rõ mục)', 'Văn bản triển khai thực hiện quy tắc ứng xử (nếu có)'] },
  'B.1.5.1': {
    qd: 'Đơn vị ban hành kế hoạch chuyển đổi vị trí công tác.',
    tl: ['Kế hoạch chuyển đổi vị trí công tác năm 2026 của đơn vị'],
    loi: 'Không dùng đề án sắp xếp bộ máy, hợp nhất đơn vị, rà soát biên chế thay cho kế hoạch chuyển đổi.' },
  'B.1.5.2': {
    qd: 'Đơn vị có báo cáo kết quả chuyển đổi vị trí công tác.',
    tl: ['Báo cáo kết quả chuyển đổi vị trí công tác năm 2026, kèm danh sách người phải và đã chuyển đổi', 'Quyết định chuyển đổi vị trí công tác'],
    luuY: 'Chưa đến thời hạn chuyển đổi thì nêu rõ trong báo cáo việc đã rà soát.' },
  'B.1.5.3': {
    qd: 'Báo cáo kết quả rà soát, xác định và thực hiện đầy đủ việc chuyển đổi các vị trí thuộc diện phải chuyển đổi, ưu tiên vị trí, lĩnh vực có nguy cơ tham nhũng cao.',
    lam: 'Chọn đơn vị đã rà soát, xác định vị trí có nguy cơ tham nhũng cao chưa; ghi số người thuộc diện phải chuyển đổi và số đã chuyển đổi.',
    tl: ['Văn bản rà soát, xác định danh mục vị trí phải chuyển đổi (vị trí có nguy cơ tham nhũng cao)', 'Danh sách người thuộc diện và đã chuyển đổi; quyết định chuyển đổi'] },
  'B.1.9.1': {
    luuY: 'Cần đủ bộ minh chứng: kế hoạch kê khai, quyết định phê duyệt danh sách, thông báo, biên bản niêm yết.',
    qd: 'Đơn vị lập danh sách người có nghĩa vụ kê khai tài sản, thu nhập.',
    tl: ['Quyết định hoặc văn bản phê duyệt danh sách người có nghĩa vụ kê khai tài sản, thu nhập năm 2026', 'Kế hoạch hoặc công văn triển khai kê khai'] },
  'B.1.9.2': {
    qd: 'Đơn vị hoàn thành kê khai, công khai bản kê khai tài sản, thu nhập đúng quy định.',
    tl: ['Báo cáo kết quả kê khai, công khai bản kê khai tài sản, thu nhập', 'Biên bản niêm yết hoặc biên bản công bố công khai tại cuộc họp'],
    luuY: 'Không tải bản kê khai tài sản, thu nhập của cá nhân lên hệ thống.' },
  'B.1.10.3': {
    qd: 'Mỗi cơ quan chuyên môn cập nhật thông báo, lịch, biên bản... thể hiện số tháng người đứng đầu trực tiếp tiếp công dân theo quy định.',
    lam: 'Ghi số tháng trong kỳ người đứng đầu trực tiếp tiếp công dân đủ theo quy định.',
    tl: ['Thông báo lịch tiếp công dân của người đứng đầu năm 2026', 'Biên bản, sổ tiếp công dân hoặc thông báo kết quả tiếp công dân hằng tháng của người đứng đầu (kể cả buổi không có công dân đến)', 'Văn bản ủy quyền tiếp công dân (nếu có)'],
    loi: 'Chỉ tải lên thông báo lịch, nội quy tiếp công dân, không có biên bản, sổ tiếp: chưa chứng minh được số tháng tiếp thực tế.' },
  'B.1.10.4': {
    qd: 'Mỗi UBND xã cập nhật thông báo, lịch, biên bản... thể hiện số tháng Chủ tịch UBND xã tiếp công dân theo điểm c khoản 2 Điều 15 Luật Tiếp công dân.',
    lam: 'Ghi số tháng trong kỳ Chủ tịch UBND xã, phường tiếp công dân đủ số ngày theo quy định và tổng số ngày Chủ tịch trực tiếp tiếp công dân.',
    tl: ['Thông báo lịch tiếp công dân của Chủ tịch UBND xã, phường năm 2026', 'Biên bản hoặc sổ tiếp công dân của các buổi tiếp (kể cả buổi không có công dân đến)'],
    loi: 'Chỉ có thông báo lịch mà không có biên bản, sổ tiếp thì chưa chứng minh được số tháng tiếp thực tế.' },
  'C.1': {
    qd: 'Liệt kê cụ thể các cuộc giám sát, kiểm tra (thanh tra đối với Thanh tra tỉnh); báo cáo kết quả kiểm tra (thanh tra) trong năm; báo cáo kết quả giám sát trong năm.',
    lam: 'Ghi số cuộc kiểm tra, giám sát do đơn vị tiến hành, đã kết thúc trong kỳ và số cuộc phát hiện tham nhũng, lãng phí, tiêu cực. Sở, ngành và UBND xã không ghi cuộc thanh tra; riêng Thanh tra tỉnh ghi thêm số cuộc thanh tra. Mỗi vụ việc phát hiện ghi một dòng ở "Sổ vụ việc" cuối trang. Không có cuộc nào: ghi 0 và giải trình.',
    tl: ['Danh sách các cuộc kiểm tra, giám sát (thanh tra) trong kỳ: tên cuộc, đối tượng, quyết định, kết luận hoặc thông báo kết quả, có hay không phát hiện TNLPTC',
      'Báo cáo kết quả kiểm tra (thanh tra) trong năm 2026',
      'Báo cáo kết quả giám sát trong năm 2026 (nếu có)',
      'Kết luận, thông báo kết quả của các cuộc có phát hiện TNLPTC'],
    loi: 'Đưa vào vụ việc phát hiện từ kỳ trước, hoặc báo cáo chỉ ghi tổng số cuộc chung, không tách từng cuộc: chỉ tính cuộc kết thúc trong kỳ và phải có danh sách cụ thể.',
    luuY: 'Không tính cuộc chỉ có kiến nghị chung, không xác định hành vi tham nhũng, lãng phí, tiêu cực.' },
  'C.2': {
    qd: 'Liệt kê cụ thể các vụ việc đã phát hiện; số tin phản ánh, đơn tố cáo, báo cáo liên quan TNLPTC; báo cáo kết quả xử lý phản ánh, giải quyết tố cáo trong năm.',
    lam: 'Ghi tổng số tin phản ánh, đơn tố cáo, báo cáo liên quan TNLPTC đơn vị tiếp nhận, xử lý trong kỳ và số vụ phát hiện qua từng nguồn. Mỗi vụ phát hiện ghi một dòng ở "Sổ vụ việc". Không tiếp nhận: ghi 0.',
    tl: ['Báo cáo kết quả tiếp nhận, xử lý phản ánh, giải quyết tố cáo liên quan TNLPTC năm 2026', 'Kết luận nội dung tố cáo, văn bản xử lý phản ánh có phát hiện vi phạm'],
    loi: 'Không tính một vụ ở nhiều nguồn; đơn không thuộc thẩm quyền đã chuyển đi thì không tính vụ phát hiện.',
    luuY: 'Không ghi họ tên người tố cáo, người phản ánh ở bất kỳ ô nào.' },
  'D.1': {
    qd: 'Liệt kê các cơ quan, đơn vị để xảy ra TNLPTC và các cơ quan đã xử lý trách nhiệm người đứng đầu, cấp phó.',
    lam: 'Ghi số cơ quan, đơn vị thuộc phạm vi quản lý để xảy ra TNLPTC trong kỳ và số cơ quan, đơn vị đã xử lý trách nhiệm người đứng đầu, cấp phó. Không phát sinh: ghi 0.',
    tl: ['Văn bản xem xét, quyết định xử lý trách nhiệm người đứng đầu, cấp phó', 'Danh sách cơ quan, đơn vị để xảy ra vụ việc'],
    loi: 'Đếm theo số cơ quan, đơn vị, không đếm theo số người; quyết định khởi tố, lệnh bắt của cơ quan tố tụng không phải là văn bản xử lý trách nhiệm người đứng đầu.' },
  'D.2': {
    loi: 'Hồ sơ tố tụng hình sự (quyết định khởi tố, lệnh bắt) không phải minh chứng xử lý kỷ luật, xử phạt hành chính; không tải bản quét mờ.',
    qd: 'Liệt kê các tổ chức, cá nhân bị xử lý kỷ luật, xử phạt hành chính do để xảy ra TNLPTC hoặc vi phạm.',
    lam: 'Ghi số tổ chức, cá nhân vi phạm do đơn vị phát hiện và số đã bị xử lý kỷ luật, xử phạt vi phạm hành chính. Không phát sinh: ghi 0.',
    tl: ['Quyết định kỷ luật, quyết định xử phạt vi phạm hành chính', 'Báo cáo kết quả xử lý'],
    luuY: 'Tải văn bản đã che họ tên hoặc chỉ ghi số, ngày quyết định nếu văn bản có thông tin cá nhân nhạy cảm.' },
  'D.4.2': {
    qd: 'Liệt kê theo từng vụ việc số tiền, tài sản TNLPTC phát hiện và đã thu hồi qua giám sát, kiểm tra, thanh tra, giải quyết tố cáo, phản ánh.',
    lam: 'Ghi tổng số tiền, tài sản phải thu hồi và đã thu hồi bằng biện pháp hành chính (đồng); chi tiết từng vụ ghi ở "Sổ vụ việc".',
    tl: ['Kết luận, quyết định thu hồi', 'Chứng từ nộp tiền vào tài khoản tạm giữ hoặc ngân sách'],
    loi: 'Nộp thông báo của cơ quan điều tra (thuộc thu hồi tư pháp) hoặc số liệu không khớp giữa các bảng: chỉ ghi thu hồi hành chính, số liệu khớp với sổ vụ việc.' },
  'Đ.2': {
    qd: 'Có văn bản chủ động kiến nghị cơ quan có thẩm quyền xử lý hành vi tham nhũng, lãng phí, tiêu cực.',
    lam: 'Có văn bản kiến nghị trong kỳ thì ghi số, ký hiệu, ngày, trích yếu văn bản vào ô và tải tệp PDF; không có thì để trống.',
    tl: ['Văn bản của đơn vị kiến nghị cơ quan có thẩm quyền (cơ quan điều tra, cơ quan quản lý cán bộ...) xử lý hành vi tham nhũng, lãng phí, tiêu cực'],
    loi: 'Báo cáo tình hình chung không thay thế văn bản kiến nghị.' }
};

/** Hướng dẫn riêng cho tiêu chí đầu mối (số liệu toàn tỉnh) - thay câu "Nội dung này do ... thực hiện" của Phụ biểu. */
var PACA_HD_DAU_MOI = {
  'B.1.9.3': { lam: 'Thanh tra tỉnh ghi văn bản vào từng ô và tải tệp PDF của cả hai văn bản. Mỗi văn bản có ghi và có tệp được tính 1 điểm.', tl: ['Quyết định hoặc văn bản của UBND tỉnh phê duyệt kế hoạch xác minh tài sản, thu nhập năm 2026', 'Kế hoạch tiến hành xác minh tài sản, thu nhập năm 2026 của Thanh tra tỉnh'] },
  'B.1.8': { lam: 'Văn phòng UBND tỉnh nhập; phối hợp NHNN Chi nhánh Khu vực 7 lấy văn bản, số liệu.', tl: ['Kế hoạch hoặc văn bản của UBND tỉnh lồng ghép nội dung phát triển thanh toán không dùng tiền mặt', 'Báo cáo kết quả thực hiện thanh toán không dùng tiền mặt trong năm'] },
  'B.2.4': { lam: 'Văn phòng UBND tỉnh nhập tổng số doanh nghiệp, tổ chức ngoài nhà nước có nghĩa vụ báo cáo và số đã báo cáo; phần tổ chức tín dụng phối hợp NHNN Chi nhánh Khu vực 7 lấy số liệu.', tl: ['Văn bản yêu cầu báo cáo của UBND tỉnh', 'Danh sách doanh nghiệp, tổ chức có nghĩa vụ báo cáo và đã báo cáo (kể cả tổ chức tín dụng)'] },
  'C.3': { lam: 'Thanh tra tỉnh phối hợp Công an tỉnh lấy số liệu và nhập: tổng số tố giác, tin báo tội phạm, kiến nghị khởi tố về TNLPTC; số vụ án được khởi tố điều tra.', tl: ['Văn bản cung cấp số liệu của Công an tỉnh (hoặc báo cáo của cơ quan điều tra)'] },
  'D.3': { lam: 'Thanh tra tỉnh phối hợp Công an tỉnh, VKSND tỉnh lấy số liệu và nhập: tổng số người bị khởi tố; số người bị cơ quan điều tra đề nghị truy tố.', tl: ['Văn bản cung cấp số liệu của Công an tỉnh, VKSND tỉnh'] },
  'D.4.3': { lam: 'Thanh tra tỉnh phối hợp Công an tỉnh, Cơ quan Thi hành án dân sự tỉnh lấy số liệu và nhập số tiền, tài sản phát hiện và đã thu hồi qua điều tra, thi hành án; đối chiếu theo vụ việc, không tính trùng.', tl: ['Văn bản cung cấp số liệu của Công an tỉnh và Cơ quan Thi hành án dân sự tỉnh'] },
  'Đ.1': { lam: 'Thanh tra tỉnh phối hợp Cơ quan Thi hành án dân sự tỉnh xác định tỷ lệ thu hồi qua thi hành án có vượt chỉ tiêu Bộ Tư pháp giao không.', tl: ['Văn bản giao chỉ tiêu; báo cáo, số liệu xác nhận của Cơ quan Thi hành án dân sự tỉnh về số phải thi hành, số thực thu và tỷ lệ hoàn thành chỉ tiêu'] }
};

/** Hướng dẫn cho Tổ công tác đánh giá ở thẻ "Số liệu cấp tỉnh" (UBND tỉnh). Văn bản dự kiến lấy từ Phụ biểu hướng dẫn của Thanh tra tỉnh. */
var PACA_HD_TINH = {
  CHUNG: { lam: 'Chỉ chọn "Có" khi có văn bản của cơ quan ngoài tỉnh (cơ quan trung ương) phát hiện vụ việc TNLPTC trên địa bàn. Khi chọn "Có", C.1, C.2, D.4.2 không được điểm tối đa theo Lưu ý 3; xem xét thêm điểm trừ E.3.', tl: ['Văn bản, kết luận của cơ quan ngoài tỉnh phát hiện vụ việc'] },
  'A.1.1.1': { qd: 'Liệt kê văn bản của UBND tỉnh triển khai các văn bản của cơ quan Trung ương về PCTNLPTC trong năm.', tl: ['Kế hoạch, công văn của UBND tỉnh triển khai văn bản của Trung ương trong năm (ví dụ Kế hoạch 271/KH-UBND ngày 29/12/2025)'] },
  'A.1.1.2': { qd: 'Kế hoạch PCTNLPTC trong năm của UBND tỉnh.', tl: ['Kế hoạch 47/KH-UBND ngày 25/02/2026 thực hiện công tác PCTNTC năm 2026'] },
  'A.1.1.3': { qd: 'Chương trình, kế hoạch tiết kiệm, chống lãng phí trong năm của UBND tỉnh.', tl: ['Quyết định 210/QĐ-UBND ngày 19/01/2026 ban hành Chương trình THTK, CLP năm 2026'] },
  'A.1.1.4': { qd: 'Liệt kê văn bản xây dựng, hoàn thiện chính sách, pháp luật để PCTNLPTC trong năm của UBND tỉnh, kể cả văn bản sửa đổi, bổ sung.', lam: 'Chọn mức theo số lần văn bản ban hành trong năm phải sửa đổi, bổ sung (0 lần: 1 điểm; 1 lần: 0,5; từ 2 lần: 0).', tl: ['Danh mục văn bản QPPL của UBND tỉnh về PCTNLPTC ban hành trong năm và văn bản sửa đổi, bổ sung (nếu có)'] },
  'A.1.2': { qd: 'Liệt kê nội dung kiểm tra, rà soát, hệ thống hóa VBQPPL để PCTNLPTC nêu trong Kế hoạch PCTNLPTC năm của UBND tỉnh.', tl: ['Kế hoạch 47/KH-UBND (ghi rõ mục có nội dung rà soát VBQPPL ở ô văn bản, ví dụ mục 2.2 phần III)'] },
  'A.1.3.1': { qd: 'Liệt kê nội dung tuyên truyền, PBGDPL để PCTNLPTC nêu trong Kế hoạch PCTNLPTC năm của UBND tỉnh.', tl: ['Kế hoạch 47/KH-UBND (ghi rõ mục có nội dung tuyên truyền, PBGDPL)'] },
  'A.1.3.2': { qd: 'Liệt kê nội dung kiểm tra, theo dõi thi hành VBQPPL để PCTNLPTC nêu trong Kế hoạch PCTNLPTC năm của UBND tỉnh.', tl: ['Kế hoạch 47/KH-UBND (ghi rõ mục có nội dung kiểm tra, theo dõi thi hành VBQPPL)'] },
  'Đ.2': { qd: 'Văn bản kiến nghị cơ quan có thẩm quyền xử lý hành vi tham nhũng, lãng phí, tiêu cực (phần của UBND tỉnh; văn bản của sở, xã tổng hợp tự động).', tl: ['Văn bản của UBND tỉnh, Chủ tịch UBND tỉnh kiến nghị cơ quan có thẩm quyền xử lý'] },
  'E.1': { qd: 'Thời gian gửi báo cáo của UBND tỉnh.', lam: 'Chọn mức theo thời điểm UBND tỉnh gửi báo cáo công tác PCTNLPTC năm, báo cáo tự đánh giá và tài liệu minh chứng.', tl: ['Văn bản gửi báo cáo (ngày gửi), xác nhận tiếp nhận của cơ quan nhận'] },
  'E.2': { qd: 'Áp dụng khi cơ quan khác phát hiện UBND tỉnh cung cấp hồ sơ, tài liệu minh chứng không chính xác.', lam: 'Chỉ chọn "Có" khi có văn bản của cơ quan khác phát hiện.', tl: ['Văn bản của cơ quan phát hiện (nếu có)'] },
  'E.3': { qd: 'Áp dụng khi báo cáo không có TNLPTC nhưng cơ quan có thẩm quyền khác phát hiện.', lam: 'Chỉ chọn "Có" khi có văn bản của cơ quan khác phát hiện vụ việc.', tl: ['Văn bản của cơ quan phát hiện (nếu có)'] },
  'E.4': { qd: 'Liệt kê người đứng đầu, cấp phó UBND tỉnh, cấp trực thuộc UBND tỉnh, cấp xã bị xử lý do TNLPTC được cơ quan khác phát hiện trong năm, theo 4 mức.', lam: 'Chọn mức xử lý cao nhất (hình sự, khai trừ: trừ 2; cách chức: trừ 1,5; cảnh cáo: trừ 1; khiển trách: trừ 0,5).', tl: ['Quyết định xử lý (chỉ ghi số, ngày; không ghi họ tên ở ô văn bản)'] }
};

if (typeof module !== 'undefined') module.exports = { PACA_HD_DAU_MOI: PACA_HD_DAU_MOI, PACA_HD_DON_VI: PACA_HD_DON_VI, PACA_HD_TINH: PACA_HD_TINH };
