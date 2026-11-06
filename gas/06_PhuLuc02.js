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

/** Số kiểu Việt Nam: 1234567,5 -> "1.234.567,5". */
function pacaSoVN(v) {
  var n = Number(v);
  if (v === '' || v == null || isNaN(n)) return String(v == null ? '' : v);
  var p = String(Math.round(n * 100) / 100).split('.');
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return p.join(',');
}

/**
 * Nội dung UBND tỉnh / đơn vị đầu mối đã nhập cho một tiêu chí cấp tỉnh: { so: ['Nhãn: giá trị'], vb: ['văn bản'] }.
 * fields: c.tinh; ô Có/Không của đầu mối là ô văn bản (ghi số, ký hiệu...) nên đưa vào vb kèm nhãn ngắn (vbT).
 */
function pacaNoiDungNhap(fields, values, vanBan) {
  values = values || {};
  var so = [], vb = [];
  var dong = function (x) { return String(x || '').split(/\n+/).map(function (t) { return t.trim().replace(/[.;,]+$/, ''); }).filter(String); };
  (fields || []).forEach(function (f) {
    var v = values[f.k];
    if (f.vb || v == null || String(v).trim() === '') return;
    if (f.type === 'yesno') {
      if (/^(có|không)$/i.test(String(v).trim())) return; // tỉnh chọn Có/Không: văn bản nằm ở ô văn bản chung
      dong(v).forEach(function (t) { vb.push((f.vbT || f.t) + ': ' + t); });
    } else if (f.type === 'select') {
      var o = (f.options || []).filter(function (x) { return String(x.v) === String(v); })[0];
      so.push(f.t + ': ' + (o ? o.t : v));
    } else if (f.type === 'number' || f.type === 'money') {
      so.push(f.t + ': ' + pacaSoVN(v));
    } else {
      dong(v).forEach(function (t) { vb.push(t); });
    }
  });
  return { so: so, vb: vb.concat(dong(vanBan)) };
}

/**
 * Nội dung nhập của các tiêu chí cấp tỉnh: { maTieuChi: { maDv, ten, so, vb } }.
 * Tiêu chí có đầu mối số liệu toàn tỉnh lấy dữ liệu đơn vị đầu mối (unitData), còn lại lấy nội dung UBND tỉnh (tinhRows, trang rà soát).
 */
function pacaNdMap(criteria, unitData, tinhRows, units) {
  unitData = unitData || {}; tinhRows = tinhRows || {};
  var ten = {}, out = {};
  (units || []).forEach(function (u) { ten[u.ma] = u.ten; });
  (criteria || []).forEach(function (c) {
    if (!c.rule || !(c.tinh || []).length) return;
    var maDv = (c.dauMoi || [])[0], nd;
    if (maDv) {
      var vals = ((unitData[maDv] || {})[c.ma] || {}).values || {};
      nd = pacaNoiDungNhap(c.tinh, vals, vals.vanBan);
    } else {
      maDv = PACA_MA_TINH;
      var d = tinhRows[c.ma] || {};
      nd = pacaNoiDungNhap(c.tinh, d.values, d.vanBan);
    }
    if (nd.so.length || nd.vb.length) out[c.ma] = { maDv: maDv, ten: maDv === PACA_MA_TINH ? 'UBND tỉnh' : (ten[maDv] || maDv), so: nd.so, vb: nd.vb };
  });
  return out;
}

/**
 * Nội dung cột tài liệu: { text, links: [{ start, end, url }] }.
 *   Tiêu chí cấp tỉnh, đầu mối số liệu toàn tỉnh (mục có nd): "<số liệu>. Văn bản minh chứng: <văn bản>." - đoạn văn bản gắn đường dẫn tệp.
 *   Sở, xã thực hiện: "Danh sách các đơn vị thực hiện gồm: Thanh tra tỉnh, xã Hóa Quỳ." - mỗi tên đơn vị gắn đường dẫn tệp.
 *   Tiêu chí đếm số đơn vị (tuMau = "2/14"): "Danh sách các đơn vị thực hiện gồm 2/14: Thanh tra tỉnh, Sở Xây dựng."
 */
function pacaCauMinhChung(items, tuMau) {
  items = items || [];
  var text = '', links = [];
  var nguon = items.filter(function (x) { return x.nd; })[0];
  items = items.filter(function (x) { return !x.nd; });
  if (nguon) {
    var nd = nguon.nd;
    if (nd.so.length) text = nd.so.join('; ') + '.';
    if (nd.vb.length || nguon.url) {
      text += (text ? ' ' : '') + 'Văn bản minh chứng: ';
      var vb = nd.vb.join('; ') || 'tệp minh chứng của ' + pacaTenTrongCau(nguon.ten);
      if (nguon.url) links.push({ start: text.length, end: text.length + vb.length, url: nguon.url });
      text += vb + '.';
    }
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
 * và nội dung cấp tỉnh / đầu mối đã nhập (ndMap = pacaNdMap(...)).
 * Nhóm E (điểm trừ) hiện điểm tự chấm là số âm.
 */
function pacaPL02Rows(scoreRows, pl2, mc, ndMap) {
  pl2 = pl2 || {}; mc = mc || {}; ndMap = ndMap || {};
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
      }) : pacaMcNguon_(mc[r.ma] || [], ndMap[r.ma]),
      tuMau: r.rule && r.demDonVi ? r.tuSo + '/' + r.mauSo : ''
    };
  });
}

/** Gắn nội dung đã nhập vào mục minh chứng của UBND tỉnh / đơn vị đầu mối (thêm mục nếu đã nhập mà chưa tải tệp). */
function pacaMcNguon_(items, nd) {
  if (!nd) return items;
  var co = false;
  var out = items.map(function (x) { if (x.ma !== nd.maDv) return x; co = true; return Object.assign({}, x, { nd: nd }); });
  return co ? out : [{ ma: nd.maDv, ten: nd.ten, url: '', nd: nd }].concat(out);
}

if (typeof module !== 'undefined') module.exports = { pacaSoVN: pacaSoVN, pacaNoiDungNhap: pacaNoiDungNhap, pacaNdMap: pacaNdMap, pacaTenTrongCau: pacaTenTrongCau, pacaCauMinhChung: pacaCauMinhChung, pacaMinhChungMap: pacaMinhChungMap, pacaDiemPL2: pacaDiemPL2, pacaPL02Rows: pacaPL02Rows };
