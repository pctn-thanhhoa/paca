/**
 * Dựng danh sách tiêu chí + ô nhập cho từng đơn vị (hàm thuần; dùng ở máy chủ và chế độ demo của trang web).
 *
 * Vai trò của đơn vị với một tiêu chí:
 *  - DON_VI : sở/xã nhập số liệu của đơn vị mình (tỉnh cộng dồn hoặc đếm số đơn vị).
 *  - DAU_MOI: đơn vị được giao cung cấp số liệu cấp tỉnh (B.1.6 Sở Nội vụ...).
 *
 * Số liệu cấp tỉnh không có đầu mối (A.1, Đ.2 phần của UBND tỉnh, E, Lưu ý 3) do Tổ công tác đánh giá xác định trên
 * trang thẩm định (pacaTinhItems), lưu ở sheet NHAP_TINH. Số liệu toàn tỉnh còn lại tổng hợp tự động.
 */

/** Mã giả dùng để lưu tệp minh chứng cấp tỉnh (sheet FILE_MINH_CHUNG), không phải một đơn vị đăng nhập. */
var PACA_MA_TINH = 'TINH';
/** Minh chứng: mỗi đơn vị, mỗi tiêu chí 01 tệp PDF ghép toàn bộ tài liệu, tối đa 20 MB. */
var PACA_FILE_MB = 20;
var PACA_NHAN_TEP = 'Tệp minh chứng (01 tệp PDF ghép, tối đa ' + PACA_FILE_MB + ' MB)';

var PACA_F_VAN_BAN = { k: 'vanBan', t: 'Văn bản, tài liệu minh chứng (số, ký hiệu, ngày, cơ quan ban hành, trích yếu; mỗi văn bản một dòng)', type: 'text', long: true };
var PACA_F_KHONG_THUOC_DIEN = { k: 'khongThuocDien', t: 'Đơn vị không thuộc diện phải thực hiện nội dung này (ghi rõ lý do ở ô Giải trình)', type: 'check' };
var PACA_F_GHI_CHU = { k: 'ghiChu', t: 'Giải trình, ghi chú (nếu có)', type: 'text', long: true };

/** Sổ vụ việc (nhóm C, D): mỗi vụ một dòng, KHÔNG ghi họ tên, thông tin nhận dạng cá nhân. */
var PACA_VU_VIEC_FIELDS = [
  { k: 'moTa', t: 'Tóm tắt vụ việc (không ghi họ tên, thông tin cá nhân)', type: 'text', w: 'rong' },
  { k: 'nguon', t: 'Nguồn phát hiện', type: 'select', options: [
    { v: 'TT', t: 'Thanh tra' }, { v: 'KT', t: 'Kiểm tra' }, { v: 'GS', t: 'Giám sát' },
    { v: 'TIN', t: 'Tin phản ánh' }, { v: 'DON', t: 'Đơn tố cáo' }, { v: 'BC', t: 'Báo cáo' }, { v: 'KHAC', t: 'Khác' }] },
  { k: 'vanBan', t: 'Kết luận, quyết định xử lý (số, ngày)', type: 'text' },
  { k: 'soViPham', t: 'Số tổ chức, cá nhân vi phạm', type: 'number' },
  { k: 'soDaXuLy', t: 'Số đã xử lý kỷ luật, XPHC', type: 'number' },
  { k: 'xuLyNguoiDungDau', t: 'Đã xử lý trách nhiệm người đứng đầu, cấp phó', type: 'select', options: [
    { v: 'CO', t: 'Có' }, { v: 'KHONG', t: 'Chưa' }, { v: 'KAD', t: 'Không đặt ra' }] },
  { k: 'chuyenDieuTra', t: 'Chuyển cơ quan điều tra', type: 'select', options: [{ v: 'CO', t: 'Có' }, { v: 'KHONG', t: 'Không' }] },
  { k: 'tienPhaiThu', t: 'Tiền, tài sản phải thu hồi (đồng)', type: 'money' },
  { k: 'tienDaThu', t: 'Đã thu hồi (đồng)', type: 'money' },
  { k: 'tinhTrang', t: 'Tình trạng', type: 'select', options: [{ v: 'XONG', t: 'Đã xử lý xong' }, { v: 'DANG', t: 'Đang xử lý' }] }
];
var PACA_VU_VIEC_TOI_DA = 200;

/** Đơn vị có dùng sổ vụ việc không (sở, xã, UBND tỉnh). */
function pacaCoSoVuViec(unit) {
  return unit.loai === 'SO' || unit.loai === 'XA';
}

/** Nhãn hiển thị của một lựa chọn. */
function pacaOptLabel(f, v) {
  var o = (f.options || []).filter(function (x) { return String(x.v) === String(v); })[0];
  return o ? o.t : (v == null ? '' : String(v));
}

/** Chuẩn hóa sổ vụ việc (dùng ở máy chủ). Ném lỗi nếu có giá trị không hợp lệ. */
function pacaCleanVuViec(list, numFn) {
  if (!list) return [];
  if (!Array.isArray(list)) throw new Error('Sổ vụ việc không hợp lệ.');
  if (list.length > PACA_VU_VIEC_TOI_DA) throw new Error('Sổ vụ việc tối đa ' + PACA_VU_VIEC_TOI_DA + ' dòng.');
  var out = [];
  list.forEach(function (r, i) {
    var o = {}, any = false;
    PACA_VU_VIEC_FIELDS.forEach(function (f) {
      var v = r ? r[f.k] : '';
      if (v === null || v === undefined || String(v).trim() === '') return;
      var s = String(v).trim().slice(0, 1000);
      if (f.type === 'select') {
        if (!(f.options || []).some(function (x) { return x.v === s; })) throw new Error('Sổ vụ việc dòng ' + (i + 1) + ': lựa chọn "' + f.t + '" không hợp lệ.');
        o[f.k] = s;
      } else if (f.type === 'number' || f.type === 'money') {
        var n = numFn(s);
        if (!/\d/.test(s) || n < 0) throw new Error('Sổ vụ việc dòng ' + (i + 1) + ': "' + f.t + '" phải là số không âm.');
        o[f.k] = n;
      } else o[f.k] = s;
      any = true;
    });
    if (!any) return;
    if (!o.moTa) throw new Error('Sổ vụ việc dòng ' + (i + 1) + ': cần ghi tóm tắt vụ việc.');
    if (!o.nguon) throw new Error('Sổ vụ việc dòng ' + (i + 1) + ': cần chọn nguồn phát hiện.');
    if ((o.soDaXuLy || 0) > (o.soViPham || 0) && o.soViPham !== undefined) throw new Error('Sổ vụ việc dòng ' + (i + 1) + ': số đã xử lý lớn hơn số vi phạm.');
    if ((o.tienDaThu || 0) > (o.tienPhaiThu || 0) && o.tienPhaiThu !== undefined) throw new Error('Sổ vụ việc dòng ' + (i + 1) + ': số tiền đã thu lớn hơn số phải thu.');
    out.push(o);
  });
  return out;
}

/** Đối chiếu sổ vụ việc với số tổng hợp đơn vị đã khai ở C.1, C.2, D.2, D.4.2 (chỉ để nhắc, không chặn). */
function pacaDoiChieuVuViec(vuViec, valuesByMa, numFn) {
  var n = function (ma, k) { return numFn(((valuesByMa[ma] || {})[k]) || 0); };
  var dem = function (ngs) { return (vuViec || []).filter(function (v) { return ngs.indexOf(v.nguon) >= 0; }).length; };
  var tong = function (k) { return (vuViec || []).reduce(function (s, v) { return s + numFn(v[k] || 0); }, 0); };
  var rows = [
    ['Vụ việc phát hiện qua thanh tra', dem(['TT']), n('C.1', 'ttPhatHien'), 'C.1 - số cuộc thanh tra phát hiện'],
    ['Vụ việc phát hiện qua kiểm tra', dem(['KT']), n('C.1', 'ktPhatHien'), 'C.1 - số cuộc kiểm tra phát hiện'],
    ['Vụ việc phát hiện qua giám sát', dem(['GS']), n('C.1', 'gsPhatHien'), 'C.1 - số cuộc giám sát phát hiện'],
    ['Vụ việc phát hiện qua tin phản ánh, đơn tố cáo, báo cáo', dem(['TIN', 'DON', 'BC']),
      n('C.2', 'tinPhatHien') + n('C.2', 'donPhatHien') + n('C.2', 'bcPhatHien'), 'C.2 - tổng số vụ phát hiện'],
    ['Tổ chức, cá nhân vi phạm', tong('soViPham'), n('D.2', 'viPham'), 'D.2'],
    ['Tổ chức, cá nhân đã xử lý', tong('soDaXuLy'), n('D.2', 'daXuLy'), 'D.2'],
    ['Tiền, tài sản phải thu hồi (đồng)', tong('tienPhaiThu'), n('D.4.2', 'phai'), 'D.4.2'],
    ['Tiền, tài sản đã thu hồi (đồng)', tong('tienDaThu'), n('D.4.2', 'da'), 'D.4.2']
  ];
  return rows.map(function (r) { return { noiDung: r[0], soVuViec: r[1], soKhai: r[2], tieuChi: r[3], lech: r[1] !== r[2] }; });
}

/** Ô Có/Không của sở, xã hiển thị thành ô văn bản: ghi văn bản và tải tệp thì hệ thống tính là "Có". */
function pacaVbField(f) {
  if (f.type !== 'yesno') return f;
  return { k: f.k, t: (f.vbT || f.t) + ': ghi số, ký hiệu, ngày, trích yếu (không có thì để trống)', type: 'text', long: true, vbCo: true };
}

function pacaFieldsFor(c, vaiTro, unit) {
  var hop = function (f) { return !f.chiMa || (unit && f.chiMa.indexOf(unit.ma) >= 0); };
  var hasVanBan = function (list) { return list.some(function (f) { return f.k === 'vanBan' || f.vbCo; }); };
  if (vaiTro === 'DAU_MOI') {
    var t = (c.tinh || []).map(pacaVbField);
    return t.concat(hasVanBan(t) ? [] : [PACA_F_VAN_BAN], [PACA_F_GHI_CHU]);
  }
  var dv = c.donVi;
  if (dv.kieu === 'dv') {
    // Đơn vị thuộc nhóm áp dụng mặc định thuộc diện; ghi văn bản + tải tệp minh chứng là đã thực hiện.
    var f = [PACA_F_VAN_BAN];
    if (dv.link) f.push({ k: 'link', t: 'Đường dẫn công khai (nếu có)', type: 'text' });
    return f.concat([PACA_F_KHONG_THUOC_DIEN, PACA_F_GHI_CHU]);
  }
  var base = dv.fields.filter(hop).map(pacaVbField);
  if (!hasVanBan(base)) base.push(PACA_F_VAN_BAN);
  return base.concat([PACA_F_GHI_CHU]);
}

/** Hướng dẫn hiển thị cho đơn vị: {lam, tl[], canCu, luuY}. */
function pacaHdDonVi(c, vaiTro) {
  var g = (typeof PACA_HD_DON_VI !== 'undefined' ? PACA_HD_DON_VI : {})[c.ma];
  var h = (typeof PACA_HUONG_DAN !== 'undefined' ? PACA_HUONG_DAN : {})[c.ma] || {};
  if (vaiTro === 'DON_VI' && g) return { qd: g.qd || '', lam: g.lam || '', tl: g.tl || [], loi: g.loi || '', canCu: h.canCu || '', luuY: g.luuY || '' };
  var dm = vaiTro === 'DAU_MOI' && typeof PACA_HD_DAU_MOI !== 'undefined' ? PACA_HD_DAU_MOI[c.ma] : null;
  if (dm) return { qd: h.yeuCau || '', lam: dm.lam, tl: dm.tl, loi: '', canCu: h.canCu || '', luuY: '' };
  return { qd: h.yeuCau || '', lam: h.huongDan || '', tl: [h.taiLieu || c.minhChung || ''].filter(Boolean), loi: '', canCu: h.canCu || '', luuY: '' };
}

/** [{c, vaiTro: 'DON_VI'|'DAU_MOI'}] */
function pacaCriteriaForUnit(unit) {
  var out = [];
  PACA_CRITERIA.forEach(function (c) {
    if (!c.rule) return;
    if (pacaUnitApplies(c, unit)) out.push({ c: c, vaiTro: 'DON_VI' });
    else if ((c.dauMoi || []).indexOf(unit.ma) >= 0) out.push({ c: c, vaiTro: 'DAU_MOI' });
  });
  return out;
}

/** Tiêu chí "nếu có" (không bắt buộc khi nộp). */
function pacaIsOptional(x) {
  return !!(x.c.donVi && x.c.donVi.tuyChon && x.vaiTro === 'DON_VI');
}

/**
 * Danh sách tiêu chí gửi cho trang nhập liệu.
 * data: { ma: {values, reviewLabel, yKien} }, files: { ma: [...] }
 */
function pacaFormList(unit, data, files) {
  var hdAll = typeof PACA_HUONG_DAN !== 'undefined' ? PACA_HUONG_DAN : {};
  return pacaCriteriaForUnit(unit).map(function (x) {
    var c = x.c, d = data[c.ma] || {};
    return {
      ma: c.ma, ten: c.ten, max: c.max, vaiTro: x.vaiTro, tuyChon: pacaIsOptional(x),
      nhom: x.vaiTro === 'DAU_MOI' ? 'DAU_MOI' : c.donVi.apDung,
      kieu: x.vaiTro === 'DON_VI' && c.donVi.kieu === 'dv' ? 'dv' : '',
      cachTinh: c.cachTinh || '', minhChung: c.minhChung || '', hd: hdAll[c.ma] || {}, hdDv: pacaHdDonVi(c, x.vaiTro),
      fields: pacaFieldsFor(c, x.vaiTro, unit).map(function (f) {
        return { k: f.k, t: f.t, type: f.type, options: f.options, long: f.long, yesLabel: f.yesLabel, noLabel: f.noLabel, vbCo: f.vbCo };
      }),
      values: d.values || {}, thamDinh: d.reviewLabel || '', yKien: d.yKien || '',
      nguoiThamDinh: d.nguoiThamDinh || '', suaSauThamDinh: !!d.suaSau,
      files: files[c.ma] || []
    };
  });
}

/**
 * Các nội dung cấp tỉnh do Tổ công tác đánh giá xác định (không tổng hợp được từ sở, xã):
 * tiêu chí có ô cấp tỉnh nhưng không giao đầu mối (A.1, Đ.2, E) và Lưu ý 3 (mã 'CHUNG').
 * tinhRows: { ma: { values: {k: v}, vanBan, ghiChu, nguoi } }, files: { ma: [...] }
 */
function pacaTinhItems(tinhRows, files) {
  tinhRows = tinhRows || {}; files = files || {};
  var hdAll = typeof PACA_HUONG_DAN !== 'undefined' ? PACA_HUONG_DAN : {};
  var pick = function (f) { return { k: f.k, t: f.t, type: f.type, options: f.options }; };
  var hdT = typeof PACA_HD_TINH !== 'undefined' ? PACA_HD_TINH : {};
  var out = [];
  var ch = tinhRows.CHUNG || {};
  out.push({ ma: 'CHUNG', ten: 'Lưu ý 3 Phụ lục II: vụ việc TNLPTC trên địa bàn do cơ quan ngoài địa phương phát hiện',
    max: '', cachTinh: 'Có: C.1, C.2, D.4.2 không có điểm (và xem xét điểm trừ E.3).', minhChung: '', hd: {}, hdTinh: hdT.CHUNG || {},
    fields: PACA_TINH_CHUNG.map(pick), values: ch.values || {}, vanBan: ch.vanBan || '', ghiChu: ch.ghiChu || '', nguoi: ch.nguoi || '', files: [] });
  PACA_CRITERIA.forEach(function (c) {
    if (!c.rule || !(c.tinh || []).length || (c.dauMoi || []).length) return;
    var d = tinhRows[c.ma] || {};
    var vb = c.tinh.filter(function (f) { return f.vb; });
    out.push({ ma: c.ma, ten: c.ten, max: c.max, cachTinh: c.cachTinh || '', minhChung: c.minhChung || '', hd: hdAll[c.ma] || {}, hdTinh: hdT[c.ma] || {},
      fields: c.tinh.filter(function (f) { return !f.vb; }).map(pick), tuDong: vb.map(function (f) { return f.t; }),
      values: d.values || {}, vanBan: d.vanBan || '', ghiChu: d.ghiChu || '', nguoi: d.nguoi || '',
      files: files[c.ma] || [] });
  });
  return out;
}

/** Tên các dòng tổng hợp (A, A.1, B.1.1 ...) để trang web làm tiêu đề nhóm. */
function pacaGroupNames() {
  var g = {};
  PACA_CRITERIA.forEach(function (c) { if (!c.rule) g[c.ma] = c.ten; });
  return g;
}

// ---------------- Đặt tên thư mục, tệp minh chứng theo cây thư mục nộp Thanh tra Chính phủ ----------------
/** Bỏ dấu tiếng Việt. */
function pacaKhongDau(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}
/** Thư mục tiêu chí: mã viết gạch ngang (A.2.4.1 -> A-2-4-1; Đ.1 -> Đ-1). */
function pacaThuMucTC(ma) { return String(ma || '').trim().replace(/\./g, '-'); }
/** Tên đơn vị trong tên tệp: không dấu, nối bằng "_" (UBND tỉnh: UBND_tinh_Thanh_Hoa). */
function pacaTenDvTep(unit) {
  var ten = unit.ma === PACA_MA_TINH ? 'UBND tỉnh Thanh Hóa' : unit.ten;
  return pacaKhongDau(ten).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
}
/** Số thứ tự tiếp theo của đơn vị trong thư mục tiêu chí, từ tên các tệp đang có (..._01.pdf). */
function pacaSttTiep(tenCacTep) {
  var max = 0;
  (tenCacTep || []).forEach(function (t) { var m = String(t).match(/_(\d+)\.pdf$/i); if (m) max = Math.max(max, +m[1]); });
  return max + 1;
}
/** 10 ký tự đầu của tên tệp gốc (bỏ đuôi .pdf, không dấu, ký tự đặc biệt thành "_"): "6193 TTTH-VP.pdf" -> "6193_TTTH". */
function pacaDauTenGoc(tenGoc) {
  return pacaKhongDau(String(tenGoc || '').replace(/\.pdf$/i, '')).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+/, '').slice(0, 10).replace(/_+$/, '');
}
/** Tên tệp: <Mã ĐV>_<Tên ĐV không dấu>_<10 ký tự đầu tên tệp gốc>_<STT 2 chữ số>.pdf, ví dụ SO14_Thanh_tra_tinh_6193_TTTH_01.pdf. */
function pacaTenTep(unit, stt, tenGoc) {
  var g = pacaDauTenGoc(tenGoc);
  return unit.ma + '_' + pacaTenDvTep(unit) + (g ? '_' + g : '') + '_' + (stt < 10 ? '0' : '') + stt + '.pdf';
}

if (typeof module !== 'undefined') {
  module.exports = { PACA_FILE_MB: PACA_FILE_MB, PACA_NHAN_TEP: PACA_NHAN_TEP, pacaKhongDau: pacaKhongDau, pacaThuMucTC: pacaThuMucTC, pacaTenDvTep: pacaTenDvTep, pacaSttTiep: pacaSttTiep, pacaTenTep: pacaTenTep, pacaDauTenGoc: pacaDauTenGoc, pacaHdDonVi: pacaHdDonVi, PACA_F_KHONG_THUOC_DIEN: PACA_F_KHONG_THUOC_DIEN,
    pacaFieldsFor: pacaFieldsFor, pacaCriteriaForUnit: pacaCriteriaForUnit, pacaFormList: pacaFormList,
    pacaIsOptional: pacaIsOptional, pacaGroupNames: pacaGroupNames, pacaCleanVuViec: pacaCleanVuViec,
    pacaDoiChieuVuViec: pacaDoiChieuVuViec, pacaCoSoVuViec: pacaCoSoVuViec, pacaOptLabel: pacaOptLabel,
    PACA_VU_VIEC_FIELDS: PACA_VU_VIEC_FIELDS, PACA_MA_TINH: PACA_MA_TINH, pacaTinhItems: pacaTinhItems
  };
}
