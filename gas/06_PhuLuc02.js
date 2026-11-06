/**
 * Bảng tự chấm điểm theo mẫu Phụ lục II QĐ 47/2026/QĐ-TTg ("Phụ lục 02" gửi Thanh tra Chính phủ):
 *   TÊN TIÊU CHÍ ĐÁNH GIÁ | CÁCH TÍNH ĐIỂM | YÊU CẦU TÀI LIỆU, SỐ LIỆU PHỤC VỤ ĐÁNH GIÁ | Điểm tối đa | Điểm tự chấm | GHI CHÚ
 * Cột tài liệu: nội dung cấp tỉnh hiện "Văn bản minh chứng: ..." (văn bản UBND tỉnh đã ghi, gắn đường dẫn tệp);
 * nội dung sở, xã thực hiện hiện danh sách đơn vị đã tải minh chứng, mỗi tên đơn vị gắn đường dẫn tệp.
 * Hàm thuần, dùng chung máy chủ (xuất phụ biểu, trang rà soát) và chế độ thử nghiệm.
 */

/**
 * Minh chứng theo tiêu chí: { ma: [{ ma: mã ĐV, ten, url }] }, UBND tỉnh đứng đầu, sau đó theo thứ tự danh mục đơn vị.
 * tep: [{ maDv, ma, url }] (tệp đang hiệu lực); units: [{ ma, ten }] theo thứ tự danh mục. Mỗi đơn vị một tệp (tệp mới nhất).
 */
function pacaMinhChungMap(tep, units) {
  var thuTu = {}, ten = {};
  thuTu[PACA_MA_TINH] = -1; ten[PACA_MA_TINH] = 'UBND tỉnh';
  (units || []).forEach(function (u, i) { thuTu[u.ma] = i; ten[u.ma] = u.ten; });
  var by = {};
  (tep || []).forEach(function (f) {
    if (thuTu[f.maDv] === undefined || !f.url) return;
    (by[f.ma] = by[f.ma] || {})[f.maDv] = f.url;
  });
  var out = {};
  Object.keys(by).forEach(function (ma) {
    out[ma] = Object.keys(by[ma]).sort(function (a, b) { return thuTu[a] - thuTu[b]; })
      .map(function (m) { return { ma: m, ten: ten[m], url: by[ma][m] }; });
  });
  return out;
}


/** Tên đơn vị đứng giữa câu: "Xã Hóa Quỳ" -> "xã Hóa Quỳ", "Phường ..." -> "phường ..." (tên cơ quan giữ nguyên). */
function pacaTenTrongCau(ten) {
  return String(ten || '').replace(/^(Xã|Phường|Đặc khu)(?=\s)/, function (m) { return m.toLowerCase(); });
}

/**
 * Nội dung cột tài liệu: { text, links: [{ start, end, url }] }, mỗi tên đơn vị gắn đường dẫn tệp minh chứng (nếu có).
 *   "Danh sách các đơn vị thực hiện gồm: Thanh tra tỉnh, xã Hóa Quỳ."
 *   tiêu chí đếm số đơn vị (tuMau = "2/14"): "Danh sách các đơn vị thực hiện gồm 2/14: Thanh tra tỉnh, Sở Xây dựng."
 */
function pacaCauMinhChung(items, tuMau) {
  items = items || [];
  var text = '', links = [];
  // UBND tỉnh: "Văn bản minh chứng: <văn bản đã ghi>." - cả đoạn văn bản gắn đường dẫn tệp
  var tinh = items.filter(function (x) { return x.ma === PACA_MA_TINH; })[0];
  items = items.filter(function (x) { return x.ma !== PACA_MA_TINH; });
  if (tinh) {
    var vb = String(tinh.vanBan || '').split(/\n+/).map(function (s) { return s.trim().replace(/[.;,]+$/, ''); }).filter(String).join('; ');
    text = 'Văn bản minh chứng: ';
    var nd = vb || 'tệp minh chứng của UBND tỉnh';
    if (tinh.url) links.push({ start: text.length, end: text.length + nd.length, url: tinh.url });
    text += nd + '.';
  }
  if (!items.length) return { text: text || (tuMau ? 'Số đơn vị thực hiện: ' + tuMau + '.' : ''), links: links };
  if (text) text += ' ';
  text += 'Danh sách các đơn vị thực hiện gồm' + (tuMau ? ' ' + tuMau : '') + ': ';
  items.forEach(function (x, i) {
    var ten = pacaTenTrongCau(x.ten);
    if (i) text += ', ';
    if (x.url) links.push({ start: text.length, end: text.length + ten.length, url: x.url });
    text += ten;
  });
  return { text: text + '.', links: links };
}

/** Điểm tối đa theo Phụ lục II: chuỗi gốc ("0,5", "+2", "-2", "" với Đ, E) và số tương ứng. */
function pacaDiemPL2(txt) {
  var t = String(txt == null ? '' : txt).replace(/\s+/g, '');
  if (!t) return '';
  var n = Number(t.replace('+', '').replace(',', '.'));
  return isNaN(n) ? '' : n;
}

/**
 * Dòng bảng Phụ lục 02 từ kết quả chấm (pacaScore().rows), nguyên văn Phụ lục II (PACA_PL2), minh chứng (pacaMinhChungMap)
 * và văn bản cấp tỉnh đã ghi (vbTinh: { maTieuChi: vanBan }, từ trang rà soát).
 * Nhóm E (điểm trừ) hiện điểm tự chấm là số âm.
 */
function pacaPL02Rows(scoreRows, pl2, mc, vbTinh) {
  pl2 = pl2 || {}; mc = mc || {}; vbTinh = vbTinh || {};
  return (scoreRows || []).map(function (r) {
    var q = pl2[r.ma] || {};
    var tru = /^E/.test(r.ma);
    var diem = tru && r.diem ? -r.diem : r.diem;
    return {
      ma: r.ma, cap: r.cap, rule: !!r.rule,
      ten: q.ten || (r.ma + '. ' + r.ten),
      cachTinh: r.rule ? (q.cachTinh || r.cachTinh || '') : '',
      max: q.diem !== undefined ? pacaDiemPL2(q.diem) : r.max,
      diem: diem,
      ghiChu: r.rule ? (r.chiTiet || []).concat(r.canhBao || []).join('\n') : '',
      dieuChinh: !!r.dieuChinh,
      minhChung: !r.rule ? [] : r.demDonVi ? (r.dvDat || []).map(function (d) {
        var f = (mc[r.ma] || []).filter(function (x) { return x.ma === d.ma; })[0];
        return { ma: d.ma, ten: d.ten, url: f ? f.url : '' };
      }) : pacaMcTinh_(mc[r.ma] || [], vbTinh[r.ma]),
      tuMau: r.rule && r.demDonVi ? r.tuSo + '/' + r.mauSo : ''
    };
  });
}

/** Gắn văn bản cấp tỉnh vào mục minh chứng của UBND tỉnh (thêm mục nếu tỉnh ghi văn bản mà chưa tải tệp). */
function pacaMcTinh_(items, vb) {
  if (!vb) return items;
  var co = false;
  var out = items.map(function (x) { if (x.ma !== PACA_MA_TINH) return x; co = true; return Object.assign({}, x, { vanBan: vb }); });
  return co ? out : [{ ma: PACA_MA_TINH, ten: 'UBND tỉnh', url: '', vanBan: vb }].concat(out);
}

if (typeof module !== 'undefined') module.exports = { pacaTenTrongCau: pacaTenTrongCau, pacaCauMinhChung: pacaCauMinhChung, pacaMinhChungMap: pacaMinhChungMap, pacaDiemPL2: pacaDiemPL2, pacaPL02Rows: pacaPL02Rows };
