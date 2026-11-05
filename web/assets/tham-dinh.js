/* PACA 2026 - Trang thẩm định dùng chung của Tổ công tác đánh giá. Chế độ thử nghiệm: ?demo=1 (mã DEMO). */
(function () {
  'use strict';
  var DEMO = /[?&]demo=1/.test(location.search);
  var URL_API = (window.PACA_CONFIG || {}).WEB_APP_URL || '';
  var KEY = 'paca2026_td';
  var st = { token: '', ten: '', ds: [], hs: null, tong: null };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nl(s) { return esc(s).replace(/\n/g, '<br>'); }
  function fmtNum(v) {
    if (v === '' || v == null) return '';
    var n = Number(v);
    return isFinite(n) ? n.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : String(v);
  }
  function msg(text, kind) {
    $('#footer').classList.toggle('hidden', !text);
    var el = $('#msg');
    el.className = 'msg ' + (kind ? 'alert ' + kind : '');
    el.textContent = text || '';
  }

  function api(action, payload) {
    var body = Object.assign({ action: action }, payload || {});
    if (st.token && !body.token) body.token = st.token;
    var p = DEMO ? window.PACA_DEMO_API(body) :
      fetch(URL_API, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' })
        .then(function (r) { if (!r.ok) throw new Error('Lỗi kết nối máy chủ (' + r.status + ').'); return r.json(); });
    return p.then(function (res) {
      if (!res || !res.success) {
        if (res && res.hetPhien) logout(true);
        throw new Error((res && res.message) || 'Có lỗi xảy ra.');
      }
      return res;
    });
  }

  // ---------- Đăng nhập ----------
  function doLogin() {
    var ten = $('#tdTen').value.trim(), ma = $('#tdMa').value.trim();
    if (!ten || !ma) { $('#loginNote').innerHTML = '<div class="alert warn">Nhập họ tên và mã rà soát.</div>'; return; }
    $('#btnLogin').disabled = true;
    $('#loginNote').innerHTML = '<div class="alert info">Đang đăng nhập...</div>';
    api('tdDangNhap', { ten: ten, ma: ma }).then(function (res) {
      st.token = res.token; st.ten = res.ten;
      sessionStorage.setItem(KEY, JSON.stringify({ token: res.token, ten: res.ten }));
      localStorage.setItem(KEY + '_ten', res.ten);
      $('#tdMa').value = '';
      showMain(res);
    }).catch(function (e) { $('#loginNote').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>'; })
      .then(function () { $('#btnLogin').disabled = false; });
  }

  function logout(expired) {
    if (st.token && !expired) api('tdDangXuat', {}).catch(function () {});
    st.token = ''; sessionStorage.removeItem(KEY);
    $('#main').classList.add('hidden'); $('#loginCard').classList.remove('hidden');
    if (expired) $('#loginNote').innerHTML = '<div class="alert warn">Phiên rà soát đã hết hạn, vui lòng đăng nhập lại.</div>';
  }

  function showMain(res) {
    $('#loginCard').classList.add('hidden'); $('#main').classList.remove('hidden');
    $('#tdNguoi').textContent = 'Thành viên Tổ công tác đánh giá: ' + st.ten;
    applyTongQuan(res);
  }

  function applyTongQuan(res) {
    st.ds = res.donVi || []; st.tong = res.tong; st.nam = res.nam || ''; st.ky = res.kySoLieu || '';
    $('#thuMucMC').innerHTML = '📁 <b>Thư mục minh chứng (Google Drive):</b> ' + (res.thuMucMinhChung
      ? '<a href="' + esc(res.thuMucMinhChung) + '" target="_blank" rel="noopener">Mở thư mục minh chứng</a> <span class="muted">- các thư mục con xếp theo mã tiêu chí (A-1-1-1, B-1-10-3...), mỗi tệp đặt tên theo đơn vị. Chỉ tài khoản được chia sẻ mới mở được.</span>'
      : '<span class="muted">' + (window.PACA_DEMO_API ? 'chế độ thử nghiệm không có thư mục thật.' : 'chưa đặt thư mục (menu PACA 2026 > 2 trong Google Sheet).') + '</span>');
    var t = res.tong;
    $('#tongDiem').innerHTML = t ? 'Điểm tạm tính toàn tỉnh: <b>' + fmtNum(t.tong) + '</b> <span class="muted">(A ' + fmtNum(t.A) + ' · B ' + fmtNum(t.B) +
      ' · C ' + fmtNum(t.C) + ' · D ' + fmtNum(t.D) + ' · cộng ' + fmtNum(t.diemCong) + ' · trừ ' + fmtNum(t.diemTru) + '; ' + t.soThieuSoLieu +
      ' tiêu chí còn thiếu số liệu; tính lúc ' + esc(res.luc || '') + ')</span>' : 'Chưa tính được điểm.';
    renderList();
  }

  function reload() {
    msg('Đang tải số liệu...', 'info');
    return api('tdTongQuan', {}).then(function (res) { applyTongQuan(res); msg(''); })
      .catch(function (e) { msg(e.message, 'err'); });
  }

  // ---------- Danh sách ----------
  function badgeTT(tt) {
    var cls = tt === 'Đã gửi' ? 'ok' : tt === 'Đang nhập' ? 'blue' : '';
    return '<span class="badge ' + cls + '">' + esc(tt) + '</span>';
  }

  function renderList() {
    var loai = $('#fLoai').value, tt = $('#fTT').value, q = $('#fTim').value.trim().toLowerCase(), cho = $('#fCho').checked;
    var list = st.ds.filter(function (u) {
      if (loai === 'XA' && u.loai !== 'XA') return false;
      if (loai === 'SO' && u.loai === 'XA') return false;
      if (tt && u.trangThai !== tt) return false;
      if (cho && !u.tk.cho) return false;
      if (q && (u.ten + ' ' + u.ma).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var nop = st.ds.filter(function (u) { return u.trangThai === 'Đã gửi'; }).length;
    var choAll = st.ds.reduce(function (s, u) { return s + u.tk.cho; }, 0);
    $('#listSum').innerHTML = 'Hiển thị ' + list.length + '/' + st.ds.length + ' đơn vị. Đã gửi dữ liệu: <b>' + nop + '</b>; tổng số tiêu chí chờ rà soát: <b>' + choAll + '</b>.';
    $('#dsBody').innerHTML = list.map(function (u) {
      var k = u.tk;
      return '<tr data-u="' + esc(u.ma) + '"><td>' + esc(u.ma) + '</td><td>' + esc(u.ten) + '<br><span class="muted">' + esc(u.nhom) + '</span></td><td>' + badgeTT(u.trangThai) +
        (u.nopLuc ? '<br><span class="muted">' + esc(u.nopLuc) + '</span>' : '') + '</td><td class="so">' + k.daNhap + '/' + k.phaiNhap + '</td><td class="so">' +
        (k.cho ? '<span class="badge warn">' + k.cho + '</span>' : '0') + '</td><td class="so">' + k.daThamDinh + (k.khongDat ? ' <span class="badge err">' + k.khongDat + ' KĐ</span>' : '') +
        '</td><td class="so">' + (k.boSung ? '<span class="badge warn">' + k.boSung + '</span>' : '0') + '</td><td class="so">' + u.soFile + '</td><td class="so">' + u.soVuViec +
        '</td><td class="muted">' + esc(u.capNhatLuc || '') + '</td></tr>';
    }).join('') || '<tr><td colspan="10" class="muted">Không có đơn vị phù hợp.</td></tr>';
  }

  // ---------- Chi tiết đơn vị ----------
  function openUnit(ma) {
    msg('Đang tải hồ sơ đơn vị...', 'info');
    api('tdDonVi', { maDonVi: ma }).then(function (hs) {
      st.hs = hs; st.inDetail = true;
      $('#listView').classList.add('hidden'); $('#detailView').classList.remove('hidden');
      renderDetail();
      window.scrollTo(0, 0);
      msg('');
    }).catch(function (e) { msg(e.message, 'err'); });
  }

  function show(f, v) {
    if (v === '' || v == null) return '';
    if (f.type === 'yesno') return v === 'Có' ? (f.yesLabel || 'Có') : v === 'Không' ? (f.noLabel || 'Không') : v;
    if (f.type === 'select') { var o = (f.options || []).filter(function (x) { return String(x.v) === String(v); })[0]; return o ? o.t : v; }
    if (f.type === 'number' || f.type === 'money') return fmtNum(v);
    return v;
  }

  function isFilled(tc) {
    return Object.keys(tc.values || {}).some(function (k) { return k !== 'ghiChu' && tc.values[k] !== '' && tc.values[k] != null; });
  }
  function choTD(tc) { return isFilled(tc) && (!tc.thamDinh || tc.suaSauThamDinh); }

  function chips(tc) {
    var c = isFilled(tc) ? '<span class="badge ok">Đã nhập</span>' : (tc.tuyChon ? '<span class="badge">Nếu có</span>' : '<span class="badge err">Chưa nhập</span>');
    if (tc.vaiTro === 'DAU_MOI') c += ' <span class="badge blue">Đầu mối</span>';
    if (tc.vaiTro === 'TINH') c += ' <span class="badge blue">Cấp tỉnh</span>';
    if ((tc.files || []).length) c += ' <span class="badge">' + tc.files.length + ' tệp</span>';
    if (tc.thamDinh) c += ' <span class="badge ' + (tc.thamDinh === 'Đạt' ? 'ok' : tc.thamDinh === 'Không đạt' ? 'err' : 'warn') + '">TĐ: ' + esc(tc.thamDinh) + '</span>';
    if (tc.suaSauThamDinh) c += ' <span class="badge warn">Đơn vị sửa sau rà soát</span>';
    else if (choTD(tc)) c += ' <span class="badge warn">Chờ rà soát</span>';
    return c;
  }

  function tcHtml(tc) {
    var v = tc.values || {};
    var data = tc.fields.filter(function (f) { return f.k !== 'vanBan' && f.k !== 'ghiChu'; }).map(function (f) {
      var s = show(f, v[f.k]);
      return '<div class="kv">' + esc(f.t) + ': <b>' + (s === '' ? '<span class="muted">—</span>' : esc(s)) + '</b></div>';
    }).join('');
    var files = (tc.files || []).map(function (f) {
      return '<li><span>📄 ' + (f.url ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.ten) + '</a>' : esc(f.ten)) + (f.tenGoc ? ' <span class="muted">- tên gốc: ' + esc(f.tenGoc) + '</span>' : '') + 
        ' <span class="muted">(' + esc(f.kb) + ' KB, ' + esc(f.thoiGian) + ')</span></span></li>';
    }).join('');
    var opts = (st.hs.tdLabels || []).map(function (l) { return '<option' + (l === tc.thamDinh ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('');
    var h = tc.hd || {};
    return '<details class="tc" data-tc="' + esc(tc.ma) + '"><summary><span class="ma">' + esc(tc.ma) + '</span><span class="ten">' + esc(tc.ten) +
      '<br><span class="chips">' + chips(tc) + '</span></span><span class="diem">' + fmtNum(tc.max) + ' điểm</span></summary>' +
      '<div class="tc-body"><div>' + data +
      (v.vanBan ? '<div class="kv" style="margin-top:8px">Văn bản minh chứng:<br><b>' + nl(v.vanBan) + '</b></div>' : '') +
      (v.ghiChu ? '<div class="kv">Giải trình: <i>' + nl(v.ghiChu) + '</i></div>' : '') +
      '<div class="files"><b>Tệp minh chứng</b><ul>' + (files || '<li class="muted">Không có tệp.</li>') + '</ul></div>' +
      '<div class="td-box"><div class="row"><div><label>Kết quả rà soát</label><select data-td="' + esc(tc.ma) + '"><option value="">-- Chưa rà soát --</option>' + opts + '</select></div>' +
      '<div><label>Ý kiến rà soát (đơn vị xem được)</label><textarea data-yk="' + esc(tc.ma) + '" maxlength="2000" style="min-height:44px">' + esc(tc.yKien) + '</textarea></div></div>' +
      '<div class="tools" style="margin-top:6px"><button class="btn nho" type="button" data-save="' + esc(tc.ma) + '">Lưu rà soát</button>' +
      '<button class="btn nho xanhla" type="button" data-dat="' + esc(tc.ma) + '">Đạt</button>' +
      '<span class="muted" data-ky="' + esc(tc.ma) + '">' + (tc.nguoiThamDinh ? 'Đã rà soát: ' + esc(tc.nguoiThamDinh) : '') + '</span></div></div>' +
      '</div><div><div class="hd"><p><b>Cách tính điểm:</b> ' + esc(tc.cachTinh) + '</p>' +
      (h.taiLieu || tc.minhChung ? '<p><b>Tài liệu minh chứng:</b> ' + esc(h.taiLieu || tc.minhChung) + '</p>' : '') +
      (h.huongDan ? '<p><b>Hướng dẫn:</b> ' + esc(h.huongDan) + '</p>' : '') + '</div></div></div></details>';
  }

  function renderDetail() {
    var hs = st.hs, dv = hs.donVi;
    $('#dTen').textContent = dv.ma + ' - ' + dv.ten;
    $('#dInfo').innerHTML = 'Trạng thái: ' + badgeTT(dv.trangThai) + (dv.nopLuc ? ' lúc ' + esc(dv.nopLuc) : '') +
      ' · Người nhập: ' + esc(dv.nguoiNhap || '—') + (dv.dienThoai ? ' · ĐT: ' + esc(dv.dienThoai) : '') + (dv.email ? ' · ' + esc(dv.email) : '') +
      ' · ' + hs.tieuChi.length + ' tiêu chí';
    var html = '', lastTop = '';
    hs.tieuChi.forEach(function (tc) {
      var top = tc.ma.split('.')[0];
      if (top !== lastTop) { html += '<div class="nhom1">' + esc(top) + '. ' + esc(hs.nhom[top] || '') + '</div>'; lastTop = top; }
      html += tcHtml(tc);
    });
    $('#dCriteria').innerHTML = html || '<div class="alert info">Đơn vị không có tiêu chí trên hệ thống.</div>';
    renderVuViec();
  }

  function renderVuViec() {
    var hs = st.hs, box = $('#dVuViec');
    if (!hs.coSoVuViec) { box.innerHTML = ''; return; }
    var F = hs.vuViecFields || [], list = hs.vuViec || [];
    var tb = list.length ? '<div style="overflow:auto"><table class="dc"><tr><th>STT</th>' + F.map(function (f) { return '<th>' + esc(f.t) + '</th>'; }).join('') + '</tr>' +
      list.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td>' + F.map(function (f) { return '<td>' + esc(show(f, r[f.k])) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</table></div>' : '<p class="muted">Đơn vị không kê khai vụ việc nào.</p>';
    var dc = (hs.doiChieu || []);
    var lech = dc.filter(function (r) { return r.lech; }).length;
    box.innerHTML = '<div class="nhom1">SỔ VỤ VIỆC (' + list.length + ')</div><div class="card">' + tb +
      '<p style="margin-top:12px"><b>Đối chiếu với số tổng hợp:</b> ' + (lech ? '<span class="badge warn">' + lech + ' nội dung chênh lệch</span>' : '<span class="badge ok">khớp</span>') + '</p>' +
      '<table class="dc"><tr><th>Nội dung</th><th>Theo sổ</th><th>Đã khai</th><th>Tiêu chí</th></tr>' + dc.map(function (r) {
        return '<tr' + (r.lech ? ' class="lech"' : '') + '><td>' + esc(r.noiDung) + '</td><td>' + fmtNum(r.soVuViec) + '</td><td>' + fmtNum(r.soKhai) + '</td><td>' + esc(r.tieuChi) + '</td></tr>';
      }).join('') + '</table></div>';
  }

  function tcBy(ma) { return st.hs.tieuChi.filter(function (t) { return t.ma === ma; })[0]; }

  function saveTD(ma, label) {
    var sel = $('[data-td="' + ma + '"]'), yk = $('[data-yk="' + ma + '"]');
    if (label) sel.value = label;
    var tc = tcBy(ma);
    msg('Đang lưu rà soát ' + ma + '...', 'info');
    api('tdLuu', { maDonVi: st.hs.donVi.ma, ma: ma, thamDinh: sel.value, yKien: yk.value.trim() }).then(function (res) {
      tc.thamDinh = sel.value; tc.yKien = yk.value.trim(); tc.nguoiThamDinh = res.nguoiThamDinh; tc.suaSauThamDinh = false;
      var d = $('details[data-tc="' + ma + '"]');
      $('.chips', d).innerHTML = chips(tc);
      $('[data-ky="' + ma + '"]').textContent = res.nguoiThamDinh ? 'Đã rà soát: ' + res.nguoiThamDinh : '';
      msg(res.message, 'ok');
    }).catch(function (e) { msg('Chưa lưu được: ' + e.message, 'err'); });
  }

  // ---------- Số liệu cấp tỉnh ----------
  function showTab(tinh) {
    $('#tabTinh').className = 'btn nho' + (tinh ? '' : ' vien');
    $('#tabDonVi').className = 'btn nho' + (tinh ? ' vien' : '');
    $('#tinhView').classList.toggle('hidden', !tinh);
    $('#listView').classList.toggle('hidden', tinh || !!st.inDetail);
    $('#detailView').classList.toggle('hidden', tinh || !st.inDetail);
    if (tinh) loadTinh();
  }

  function loadTinh() {
    msg('Đang tải số liệu cấp tỉnh...', 'info');
    return api('tdTinh', {}).then(function (res) { st.tinh = res; renderTinh(); renderBang(); msg(''); })
      .catch(function (e) { msg(e.message, 'err'); });
  }

  function tinhInput(it, f) {
    var v = it.values[f.k]; v = v == null ? '' : v;
    var a = ' data-tk="' + esc(it.ma) + '" data-k="' + esc(f.k) + '" data-type="' + f.type + '"';
    if (f.type === 'yesno') return '<select' + a + '><option value="">-- Chưa xác định --</option><option' + (v === 'Có' ? ' selected' : '') + '>Có</option><option' + (v === 'Không' ? ' selected' : '') + '>Không</option></select>';
    if (f.type === 'select') return '<select' + a + '><option value="">-- Chưa xác định --</option>' + (f.options || []).map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (v !== '' && String(o.v) === String(v) ? ' selected' : '') + '>' + esc(o.t) + '</option>';
    }).join('') + '</select>';
    return '<input type="text"' + a + ' value="' + esc(fmtNum(v)) + '">';
  }

  function tinhFiles(it) {
    if (it.ma === 'CHUNG') return '';
    var list = (it.files || []).map(function (f) {
      return '<li><span>📄 <a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.ten) + '</a> ' + (f.tenGoc ? ' <span class="muted">- tên gốc: ' + esc(f.tenGoc) + '</span>' : '') + '<span class="muted">(' + esc(f.kb) + ' KB)</span></span>' +
        '<button type="button" class="btn nho vien" data-tdel="' + esc(f.fileId) + '">Xóa</button></li>';
    }).join('');
    return '<div class="files" data-tfiles="' + esc(it.ma) + '"><b>' + PACA_NHAN_TEP + '</b><ul>' + (list || '<li class="muted">Chưa có tệp.</li>') +
      '</ul><input type="file" accept="application/pdf,.pdf" data-tup="' + esc(it.ma) + '"></div>';
  }

  function tinhCoVb(it) { return !!String(it.vanBan || '').trim() && (it.files || []).length > 0; }
  function tinhDone(it) {
    if ((it.tuDong || []).length && !tinhCoVb(it)) return false;
    return it.fields.every(function (f) { return it.values[f.k] !== undefined && it.values[f.k] !== ''; });
  }
  function tinhBadge(it) {
    if ((it.tuDong || []).length) return tinhCoVb(it) ? '<span class="badge ok">Có (đủ văn bản và tệp)</span>' :
      String(it.vanBan || '').trim() ? '<span class="badge warn">Có văn bản, chưa tải tệp</span>' : '<span class="badge err">Chưa có văn bản</span>';
    return '<span class="badge ' + (tinhDone(it) ? 'ok">Đã xác định' : 'err">Chưa xác định') + '</span>';
  }
  /** Cập nhật nhãn mục và tính lại bảng điểm ngay sau khi lưu, tải tệp, xóa tệp. */
  function capNhatTinh(ma) {
    var it = itBy(ma), b = $('details[data-ti="' + ma + '"] .chips');
    if (b) b.innerHTML = tinhBadge(it) + ((it.files || []).length ? ' <span class="badge">' + it.files.length + ' tệp</span>' : '');
    return api('tdTinh', {}).then(function (res) { st.tinh.tong = res.tong; st.tinh.bang = res.bang; st.tinh.pl02 = res.pl02; st.tinh.luc = res.luc; renderBang(); applyTongQuan({ donVi: st.ds, tong: res.tong }); }).catch(function () {});
  }

  /** Hướng dẫn cho Tổ ở từng mục cấp tỉnh: QĐ 47 yêu cầu, cách nhập, văn bản cần tải, cách tính điểm. */
  function hdTinhHtml(it, h) {
    var g = it.hdTinh || {}, p = [];
    if (g.qd) p.push('<p><b>Quyết định 47 yêu cầu:</b> ' + esc(g.qd) + '</p>');
    if ((it.tuDong || []).length) p.push('<p><b>Cách nhập:</b> ghi số, ngày, trích yếu văn bản, bấm Lưu và tải tệp PDF; có văn bản và tệp thì tự tính "có".</p>');
    else if (g.lam) p.push('<p><b>Cách nhập:</b> ' + esc(g.lam) + '</p>');
    var tl = g.tl || (h.taiLieu || it.minhChung ? [h.taiLieu || it.minhChung] : []);
    if (tl.length) p.push('<p><b>Văn bản, tài liệu cần tải lên:</b></p><ul>' + tl.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
    p.push('<p class="muted"><b>Cách tính điểm:</b> ' + esc(it.cachTinh) + '</p>');
    return '<div class="hd">' + p.join('') + '</div>';
  }

  function renderTinh() {
    var html = '', lastTop = '';
    st.tinh.items.forEach(function (it) {
      var top = it.ma === 'CHUNG' ? 'CHUNG' : it.ma.split('.')[0];
      if (top !== lastTop) {
        html += '<div class="nhom2">' + (top === 'CHUNG' ? 'Lưu ý 3 (áp dụng cho C.1, C.2, D.4.2)' : top === 'A' ? 'A.1. Lãnh đạo, chỉ đạo của UBND tỉnh' :
          top === 'Đ' ? 'Đ. Điểm cộng (phần của UBND tỉnh; phần của sở, xã tổng hợp tự động)' : 'E. Điểm trừ') + '</div>';
        lastTop = top;
      }
      var h = it.hd || {};
      html += '<details class="tc" data-ti="' + esc(it.ma) + '"' + (it.ma === 'CHUNG' ? ' open' : '') + '><summary><span class="ma">' + (it.ma === 'CHUNG' ? 'Lưu ý 3' : esc(it.ma)) + '</span><span class="ten">' + esc(it.ten) +
        '<br><span class="chips">' + tinhBadge(it) +
        ((it.files || []).length ? ' <span class="badge">' + it.files.length + ' tệp</span>' : '') + '</span></span><span class="diem">' + (it.max !== '' ? fmtNum(it.max) + ' điểm' : '') + '</span></summary>' +
        '<div class="tc-body"><div>' + it.fields.map(function (f) { return '<div class="field"><label>' + esc(f.t) + '</label>' + tinhInput(it, f) + '</div>'; }).join('') +
        '<div class="field"><label>Văn bản minh chứng (số, ký hiệu, ngày, trích yếu; mỗi văn bản một dòng)</label><textarea data-tvb="' + esc(it.ma) + '" maxlength="3000">' + esc(it.vanBan) + '</textarea></div>' +
        '<div class="field"><label>Giải trình, ghi chú</label><textarea data-tgc="' + esc(it.ma) + '" maxlength="3000" style="min-height:44px">' + esc(it.ghiChu) + '</textarea></div>' +
        '<div class="tools"><button class="btn nho" type="button" data-tsave="' + esc(it.ma) + '">Lưu</button><span class="muted" data-tky="' + esc(it.ma) + '">' + (it.nguoi ? 'Cập nhật: ' + esc(it.nguoi) : '') + '</span></div>' +
        tinhFiles(it) + '</div><div>' + hdTinhHtml(it, h) + '</div></div></details>';
    });
    $('#tinhItems').innerHTML = html;
    $$('#tinhItems [data-tup]').forEach(function (el) { el.addEventListener('change', onTinhUpload); });
  }

  function renderBang() {
    var t = st.tinh.tong;
    var rows = (st.tinh.pl02 || []).map(function (r) {
      var cls = r.cap === 1 ? 'c1' : !r.rule ? 'c2' : '';
      var diem = '<b>' + fmtNum(r.diem) + '</b>' + (r.dieuChinh ? ' <span class="badge warn">điều chỉnh</span>' : '');
      if (!r.rule) return '<tr class="' + cls + '"><td colspan="3">' + esc(r.ten) + '</td><td class="so">' + fmtNum(r.max) + '</td><td class="so">' + diem + '</td><td></td></tr>';
      var c = pacaCauMinhChung(r.minhChung, r.tuMau), mc = '', p = 0;
      c.links.forEach(function (l) {
        mc += esc(c.text.slice(p, l.start)) + (l.url !== '#' ? '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(c.text.slice(l.start, l.end)) + '</a>' : esc(c.text.slice(l.start, l.end)));
        p = l.end;
      });
      mc += esc(c.text.slice(p));
      return '<tr><td>' + esc(r.ten) + '</td><td class="ct">' + nl(r.cachTinh) + '</td><td class="mc">' + (mc || '<span class="muted">Chưa có tệp minh chứng</span>') +
        '</td><td class="so">' + fmtNum(r.max) + '</td><td class="so">' + diem + '</td><td class="cb">' + nl(r.ghiChu) + '</td></tr>';
    }).join('');
    $('#bangDiem').innerHTML = '<thead><tr><th>TÊN TIÊU CHÍ ĐÁNH GIÁ</th><th>CÁCH TÍNH ĐIỂM</th><th>YÊU CẦU TÀI LIỆU, SỐ LIỆU PHỤC VỤ ĐÁNH GIÁ</th><th>Điểm tối đa</th><th>Điểm tự chấm</th><th>GHI CHÚ (diễn giải, lưu ý)</th></tr></thead><tbody>' + rows +
      '<tr class="c1"><td colspan="3">TỔNG ĐIỂM (A + B + C + D + Đ − E, tối đa 100) - tính lúc ' + esc(st.tinh.luc) + '</td><td class="so">100</td><td class="so">' + fmtNum(t.tong) + '</td><td></td></tr></tbody>';
  }

  function itBy(ma) { return st.tinh.items.filter(function (x) { return x.ma === ma; })[0]; }

  function saveTinh(ma) {
    var it = itBy(ma), vals = {};
    $$('[data-tk="' + ma + '"]').forEach(function (el) { if (el.value.trim() !== '') vals[el.dataset.k] = el.value.trim(); });
    var vb = $('[data-tvb="' + ma + '"]').value.trim(), gc = $('[data-tgc="' + ma + '"]').value.trim();
    msg('Đang lưu ' + ma + '...', 'info');
    api('tdLuuTinh', { ma: ma, values: vals, vanBan: vb, ghiChu: gc }).then(function (res) {
      it.values = vals; it.vanBan = vb; it.ghiChu = gc; it.nguoi = res.nguoi;
      $('[data-tky="' + ma + '"]').textContent = 'Cập nhật: ' + res.nguoi;
      msg(res.message + ' Bảng điểm đã cập nhật.', 'ok');
      capNhatTinh(ma);
    }).catch(function (e) { msg('Chưa lưu được: ' + e.message, 'err'); });
  }

  function refreshTinhFiles(ma, files) {
    var it = itBy(ma); it.files = files;
    var box = $('[data-tfiles="' + ma + '"]'), tmp = document.createElement('div');
    tmp.innerHTML = tinhFiles(it); box.replaceWith(tmp.firstChild);
    $('[data-tup="' + ma + '"]').addEventListener('change', onTinhUpload);
    capNhatTinh(ma);
  }

  function onTinhUpload(e) {
    var input = e.target, ma = input.dataset.tup, files = Array.prototype.slice.call(input.files || []);
    var chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () {
        if (!/\.pdf$/i.test(file.name)) { msg('Bỏ qua "' + file.name + '": chỉ nhận PDF.', 'warn'); return; }
        if (file.size > PACA_FILE_MB * 1048576) { msg('Bỏ qua "' + file.name + '": vượt quá ' + PACA_FILE_MB + ' MB.', 'warn'); return; }
        msg('Đang tải lên "' + file.name + '"...', 'info');
        return new Promise(function (ok, ko) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(',')[1]); }; r.onerror = ko; r.readAsDataURL(file); })
          .then(function (b64) { return api('tdTaiLenTinh', { ma: ma, tenFile: file.name, base64: b64 }); })
          .then(function (res) { refreshTinhFiles(ma, res.files); msg(res.message, 'ok'); })
          .catch(function (err) { msg('Lỗi tải lên: ' + err.message, 'err'); });
      });
    });
  }

  // ---------- Khởi động ----------
  function bind() {
    $('#btnLogin').addEventListener('click', doLogin);
    $('#tabDonVi').addEventListener('click', function () { showTab(false); });
    $('#tabTinh').addEventListener('click', function () { showTab(true); });
    $('#tinhItems').addEventListener('click', function (e) {
      var s = e.target.closest('[data-tsave]');
      if (s) { saveTinh(s.dataset.tsave); return; }
      var d = e.target.closest('[data-tdel]');
      if (!d) return;
      if (!d.dataset.confirm) {
        d.dataset.confirm = '1'; d.textContent = 'Bấm lần nữa để xóa'; d.classList.add('do');
        setTimeout(function () { if (d.isConnected) { delete d.dataset.confirm; d.textContent = 'Xóa'; d.classList.remove('do'); } }, 4000);
        return;
      }
      var ma = d.closest('[data-tfiles]').dataset.tfiles;
      d.disabled = true;
      api('tdXoaFileTinh', { fileId: d.dataset.tdel }).then(function (res) { refreshTinhFiles(ma, res.files); msg(res.message, 'ok'); })
        .catch(function (err) { d.disabled = false; msg(err.message, 'err'); });
    });
    $('#tdMa').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
    $('#btnLogout').addEventListener('click', function () { logout(false); });
    $('#btnReload').addEventListener('click', function () { reload(); if (!$('#tinhView').classList.contains('hidden')) loadTinh(); });
    ['#fLoai', '#fTT', '#fCho'].forEach(function (s) { $(s).addEventListener('change', renderList); });
    $('#fTim').addEventListener('input', renderList);
    $('#dsBody').addEventListener('click', function (e) { var tr = e.target.closest('tr[data-u]'); if (tr) openUnit(tr.dataset.u); });
    $('#btnBack').addEventListener('click', function () {
      st.inDetail = false;
      $('#detailView').classList.add('hidden'); $('#listView').classList.remove('hidden'); reload();
    });
    $('#dCriteria').addEventListener('click', function (e) {
      var b = e.target.closest('[data-save],[data-dat]');
      if (!b) return;
      if (b.dataset.dat) saveTD(b.dataset.dat, 'Đạt'); else saveTD(b.dataset.save);
    });
    $('#btnExpand').addEventListener('click', function () {
      var open = $$('#dCriteria details.tc').some(function (d) { return !d.open; });
      $$('#dCriteria details.tc').forEach(function (d) { d.open = open; });
    });
    $('#btnChoTD').addEventListener('click', function () {
      var first = null;
      $$('#dCriteria details.tc').forEach(function (d) { var tc = tcBy(d.dataset.tc); d.open = choTD(tc); if (d.open && !first) first = d; });
      if (first) first.scrollIntoView({ behavior: 'smooth' }); else msg('Đơn vị không còn tiêu chí chờ rà soát.', 'ok');
    });
    $('#btnWord').addEventListener('click', function () { window.PACA_PHIEU.word(st.hs); });
    $('#btnPhuBieu').addEventListener('click', function () {
      var b = $('#btnPhuBieu');
      b.disabled = true;
      $('#pbNote').innerHTML = '<div class="alert info">Đang tổng hợp và xuất phụ biểu (có thể mất 1-2 phút)...</div>';
      api('tdXuatPhuBieu', {}).then(function (r) {
        $('#pbNote').innerHTML = '<div class="alert ok">Đã xuất <b>' + esc(r.ten) + '</b> (tổng điểm ' + fmtNum(r.tong) + '): <a href="' + esc(r.url) +
          '" target="_blank" rel="noopener">Mở Google Sheet</a> · <a href="#" id="taiWordPL02" data-ten="' + esc(r.ten) + '">Tải Word</a>. ' +
          '<span class="muted">Tệp nằm trong thư mục minh chứng; cần được chia sẻ quyền mới mở được.</span></div>';
      }).catch(function (e) { $('#pbNote').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>'; })
        .then(function () { b.disabled = false; });
    });
    // Phụ lục 02 bản Word: mỗi ô giữ đủ đường dẫn từng đơn vị (bản Excel chỉ giữ 1 đường dẫn mỗi ô)
    $('#pbNote').addEventListener('click', function (e) {
      if (e.target.id !== 'taiWordPL02') return;
      e.preventDefault();
      var ten = e.target.dataset.ten;
      e.target.textContent = 'Đang tạo tệp Word...';
      api('tdTinh', {}).then(function (res) {
        window.PACA_PHIEU.phuLuc02({ pl02: res.pl02, tong: res.tong, luc: res.luc, nam: st.nam, ky: st.ky }, ten);
      }).catch(function (er) { msg('Chưa tạo được tệp Word: ' + er.message, 'err'); })
        .then(function () { e.target.textContent = 'Tải Word'; });
    });
  }

  function start() {
    if (DEMO) document.body.insertAdjacentHTML('afterbegin', '<div class="demo-flag">CHẾ ĐỘ THỬ NGHIỆM - mã rà soát thử: DEMO</div>');
    bind();
    $('#tdTen').value = localStorage.getItem(KEY + '_ten') || '';
    if (!URL_API && !DEMO) { $('#loginNote').innerHTML = '<div class="alert err">Chưa cấu hình địa chỉ máy chủ.</div>'; return; }
    var s = null;
    try { s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    if (s && s.token) {
      st.token = s.token; st.ten = s.ten;
      api('tdTongQuan', {}).then(showMain).catch(function () { st.token = ''; sessionStorage.removeItem(KEY); });
    }
  }

  if (DEMO && !window.PACA_DEMO_API) {
    var sc = document.createElement('script');
    sc.src = 'demo/demo-loader.js';
    sc.onload = function () { window.PACA_DEMO_READY.then(start); };
    document.head.appendChild(sc);
  } else document.addEventListener('DOMContentLoaded', start);
})();
