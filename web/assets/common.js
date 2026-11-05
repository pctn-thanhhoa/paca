/* PACA 2026 - mã dùng chung cho trang nhập liệu sở ngành và xã, phường.
 * Một trang nhap-lieu.html cho mọi đơn vị (sở, ngành và xã, phường); tiêu chí lấy theo đơn vị đăng nhập.
 * Địa chỉ Web App lấy từ assets/config.js (window.PACA_CONFIG.WEB_APP_URL).
 * Chế độ thử nghiệm không cần máy chủ: thêm ?demo=1 vào địa chỉ trang.
 */
(function () {
  'use strict';
  var LOAI = window.PACA_LOAI || 'TAT_CA';
  /** Chế độ xem (mã 000000): xem nội dung đơn vị đã gửi trên máy chủ, chỉ xem, không nhập, không gửi. */
  var XEM = /[?&]xem=1/.test(location.search);
  var DEMO = /[?&]demo=1/.test(location.search) || (XEM && !(window.PACA_CONFIG || {}).WEB_APP_URL);
  window.PACA_XEM = XEM;
  var MA_XEM = '000000';
  var URL_API = (window.PACA_CONFIG || {}).WEB_APP_URL || '';
  var KEY = XEM ? 'paca2026_xem' : 'paca2026_tk';
  var st = { token: '', hs: null, dirty: false, saving: false, vv: [] };
  var MAT_MANG = 'mất kết nối mạng, dữ liệu CHƯA được gửi. Số liệu vẫn còn trên màn hình và đã lưu nháp trên máy này; khi có mạng, bấm "Gửi dữ liệu" lại.';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtNum(v) {
    if (v === '' || v == null) return '';
    var n = Number(v);
    if (!isFinite(n)) return String(v);
    return n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  }

  // ---------------- API ----------------
  function api(action, payload) {
    var body = Object.assign({ action: action }, payload || {});
    if (st.token && !body.token) body.token = st.token;
    var p = DEMO ? window.PACA_DEMO_API(body) :
      fetch(URL_API, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' })
        .catch(function () { throw new Error(MAT_MANG); })
        .then(function (r) { if (!r.ok) throw new Error('Lỗi kết nối máy chủ (' + r.status + ').'); return r.json(); });
    return p.then(function (res) {
      if (!res || !res.success) {
        var e = new Error((res && res.message) || 'Có lỗi xảy ra.');
        if (res && res.hetPhien) { logout(true); }
        throw e;
      }
      return res;
    });
  }

  function msg(text, kind) {
    var el = $('#msg');
    el.className = 'msg ' + (kind ? 'alert ' + kind : '');
    el.textContent = text || '';
  }

  // ---------------- Đăng nhập ----------------
  function initLogin() {
    if (!URL_API && !DEMO) {
      $('#loginBox').innerHTML = '<div class="alert err">Chưa cấu hình địa chỉ máy chủ (assets/config.js).</div>';
      return;
    }
    api('danhMuc', { loai: LOAI }).then(function (res) {
      $('#kySoLieu').textContent = res.kySoLieu || '';
      $('#hanNop').textContent = res.hanNop || '';
      st.dsDonVi = res.donVi || [];
      renderChonDonVi();
      if (!res.moNhap) $('#loginNote').innerHTML = '<div class="alert warn">Hệ thống đang tạm khóa nhập liệu.</div>';
    }).catch(function (e) {
      $('#loginNote').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>';
    });
    if ($('#txtTim')) $('#txtTim').addEventListener('input', renderChonDonVi);
    $('#btnLogin').addEventListener('click', doLogin);
    $('#txtMa').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
  }

  /** Bỏ dấu tiếng Việt để tìm kiếm ("hoang" khớp "Hoằng"). */
  function khongDau(t) {
    return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  }
  /** Danh sách chọn đơn vị: sở, ngành theo nhóm trước; rồi Phường, Xã, Đặc khu (xếp theo tên). */
  function renderChonDonVi() {
    var q = $('#txtTim') ? khongDau($('#txtTim').value.trim()) : '';
    var cu = $('#selDonVi').value;
    var XA = ['Phường', 'Xã', 'Đặc khu'];
    var bo = function (t) { return String(t).replace(/^(Phường|Xã|Đặc khu)\s+/i, ''); };
    var list = (st.dsDonVi || []).filter(function (u) { return !q || khongDau(u.ten).indexOf(q) >= 0; });
    var groups = {}, order = [];
    list.forEach(function (u) {
      var g = u.loai !== 'XA' ? (u.nhom || 'Sở, ban, ngành') : /^Phường/i.test(u.ten) ? 'Phường' : /^Đặc khu/i.test(u.ten) ? 'Đặc khu' : 'Xã';
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(u);
    });
    XA.forEach(function (g) {
      if (groups[g]) groups[g].sort(function (a, b) { return bo(a.ten).localeCompare(bo(b.ten), 'vi', { sensitivity: 'base' }); });
    });
    order.sort(function (a, b) { var ia = XA.indexOf(a), ib = XA.indexOf(b); return (ia < 0 ? -1 : ia) - (ib < 0 ? -1 : ib); });
    var html = '<option value="">' + (list.length ? '-- Chọn đơn vị (' + list.length + ') --' : '-- Không tìm thấy đơn vị --') + '</option>';
    order.forEach(function (g) {
      html += '<optgroup label="' + esc(g) + '">' + groups[g].map(function (u) {
        return '<option value="' + esc(u.ma) + '">' + esc(u.ten) + '</option>';
      }).join('') + '</optgroup>';
    });
    $('#selDonVi').innerHTML = html;
    if (list.length === 1) $('#selDonVi').value = list[0].ma;
    else if (cu && list.some(function (u) { return u.ma === cu; })) $('#selDonVi').value = cu;
  }

  function doLogin() {
    var ma = $('#selDonVi').value, code = $('#txtMa').value.trim();
    if (!ma || !code) { $('#loginNote').innerHTML = '<div class="alert warn">Chọn đơn vị và nhập mã truy cập.</div>'; return; }
    if (code === MA_XEM) { location.href = 'nhap-lieu.html?xem=1&dv=' + encodeURIComponent(ma); return; }
    if (XEM) { location.href = 'nhap-lieu.html'; return; }
    $('#btnLogin').disabled = true;
    $('#loginNote').innerHTML = '<div class="alert info">Đang đăng nhập...</div>';
    api('dangNhap', { maDonVi: ma, maTruyCap: code }).then(function (res) {
      st.token = res.token;
      sessionStorage.setItem(KEY, res.token);
      $('#txtMa').value = '';
      showForm(res);
    }).catch(function (e) {
      $('#loginNote').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>';
    }).then(function () { $('#btnLogin').disabled = false; });
  }

  function logout(expired) {
    if (XEM) { location.href = 'nhap-lieu.html'; return; }
    if (st.token && !expired) api('dangXuat', {}).catch(function () {});
    if (expired) luuNhap(); else xoaNhap();
    st.token = ''; st.hs = null; st.dirty = false;
    sessionStorage.removeItem(KEY);
    $('#formArea').classList.add('hidden');
    $('#footer').classList.add('hidden');
    $('#loginCard').classList.remove('hidden');
    if (expired) $('#loginNote').innerHTML = '<div class="alert warn">Phiên làm việc đã hết hạn, vui lòng đăng nhập lại. Phần nhập dở chưa gửi (nếu có) đã lưu nháp trên máy này, đăng nhập lại để khôi phục.</div>';
  }

  // ---------------- Biểu mẫu ----------------
  function showForm(hs) {
    st.hs = hs; st.dirty = false;
    st.vv = (hs.vuViec || []).map(function (r) { var o = Object.assign({}, r); delete o.stt; return o; });
    $('#loginCard').classList.add('hidden');
    $('#formArea').classList.remove('hidden');
    $('#footer').classList.remove('hidden');
    renderHeader();
    renderCriteria();
    renderVuViec();
    updateProgress();
    hoiKhoiPhuc();
    msg(hs.duocSua ? 'Nhập số liệu rồi bấm "Gửi dữ liệu" (Ctrl+S). Trước hạn, đơn vị được cập nhật, sửa chữa, thay thế tài liệu và gửi lại nhiều lần.' : hs.lyDoKhoa, hs.duocSua ? '' : 'warn');
  }

  function statusBadge(tt) {
    var cls = tt === 'Đã gửi' ? 'ok' : tt === 'Đang nhập' ? 'blue' : '';
    return '<span class="badge ' + cls + '">' + esc(tt || 'Chưa gửi') + '</span>';
  }

  function renderHeader() {
    var hs = st.hs, dv = hs.donVi;
    $('#dvTen').textContent = dv.ten;
    var nhom = dv.loai === 'XA' ? 'UBND xã, phường' : 'Sở, ban, ngành, đơn vị cấp tỉnh';
    if ($('#h1DonVi')) $('#h1DonVi').textContent = ' — ' + nhom;
    document.title = 'Nhập số liệu đánh giá PCTNLPTC năm 2026 - ' + dv.ten;
    $('#dvTrangThai').innerHTML = statusBadge(dv.trangThai) + (dv.nopLuc ? ' <span class="muted">lần gần nhất lúc ' + esc(dv.nopLuc) + '</span>' : '');
    $('#hanNop2').textContent = hs.hanNop || '';
    $('#kySoLieu2').textContent = hs.kySoLieu || '';
    $('#nguoiNhap').value = dv.nguoiNhap || '';
    $('#dienThoai').value = dv.dienThoai || '';
    $('#email').value = dv.email || '';
    ['#nguoiNhap', '#dienThoai', '#email'].forEach(function (s) { $(s).disabled = !hs.duocSua; });
    $('#lockNote').innerHTML = hs.duocSua ? '' : '<div class="alert warn">' + esc(hs.lyDoKhoa) + '</div>';
    $('#btnSave').disabled = !hs.duocSua;
    $('#scopeNote').innerHTML = scopeHtml(hs.tieuChi);
  }

  var NHOM_TEN = { XA: 'Riêng của xã, phường', CQCM: 'Riêng của cơ quan chuyên môn', DAU_MOI: 'Đầu mối số liệu toàn tỉnh' };
  function nhomBadge(tc) {
    var n = tc.nhom === 'CA_HAI' ? '' : NHOM_TEN[tc.nhom];
    if (!n) return '';
    return ' <span class="badge ' + (tc.nhom === 'DAU_MOI' ? 'daumoi' : 'blue') + '">' + n + '</span>';
  }
  /** "Đơn vị phải nhập N tiêu chí: 31 tiêu chí chung + ..." */
  function scopeHtml(list) {
    var by = {};
    list.forEach(function (t) { (by[t.nhom] = by[t.nhom] || []).push(t.ma); });
    var p = [];
    if (by.CA_HAI) p.push(esc(by.CA_HAI.length + ' tiêu chí chung'));
    if (by.XA) p.push(esc(by.XA.length + ' tiêu chí riêng của xã, phường (' + by.XA.join(', ') + ')'));
    if (by.CQCM) p.push(esc(by.CQCM.length + ' tiêu chí riêng của cơ quan chuyên môn (' + by.CQCM.join(', ') + ')'));
    if (by.DAU_MOI) p.push('<span class="do">' + esc(by.DAU_MOI.length + ' tiêu chí đầu mối số liệu toàn tỉnh (' + by.DAU_MOI.join(', ') + ')') + '</span>');
    return '<div class="scope">Đơn vị phải nhập <b class="do">' + list.length + ' tiêu chí</b>' +
      (p.length ? ': ' + p.join(' + ') : '') + '.</div>';
  }

  function inputHtml(tc, f, disabled) {
    var id = 'f_' + tc.ma.replace(/\W/g, '_') + '_' + f.k;
    var v = tc.values[f.k];
    v = v == null ? '' : v;
    var dis = disabled ? ' disabled' : '';
    var attrs = ' id="' + id + '" data-ma="' + esc(tc.ma) + '" data-k="' + esc(f.k) + '" data-type="' + f.type + '"' + dis;
    var ctl;
    if (f.type === 'check') {
      return '<div class="field chk"><label><input type="checkbox"' + attrs + (v === 'Có' ? ' checked' : '') + '> ' + esc(f.t) + '</label></div>';
    } else if (f.type === 'yesno') {
      ctl = '<select' + attrs + '><option value="">-- Chọn --</option>' +
        '<option value="Có"' + (v === 'Có' ? ' selected' : '') + '>' + esc(f.yesLabel || 'Có') + '</option>' +
        '<option value="Không"' + (v === 'Không' ? ' selected' : '') + '>' + esc(f.noLabel || 'Không') + '</option></select>';
    } else if (f.type === 'select') {
      ctl = '<select' + attrs + '><option value="">-- Chọn --</option>' + (f.options || []).map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (String(o.v) === String(v) && v !== '' ? ' selected' : '') + '>' + esc(o.t) + '</option>';
      }).join('') + '</select>';
    } else if (f.type === 'number' || f.type === 'money') {
      ctl = '<input type="text" inputmode="decimal" autocomplete="off"' + attrs + ' value="' + esc(fmtNum(v)) + '" placeholder="' + (f.type === 'money' ? 'Số tiền (đồng)' : 'Số') + '">';
    } else if (f.long) {
      ctl = '<textarea' + attrs + ' maxlength="3000">' + esc(v) + '</textarea>';
    } else {
      ctl = '<input type="text"' + attrs + ' maxlength="3000" value="' + esc(v) + '">';
    }
    return '<div class="field"><label for="' + id + '">' + esc(f.t) + '</label>' + ctl + '</div>';
  }

  function hdHtml(tc) {
    var h = tc.hdDv || {}, parts = [];
    if (h.qd) parts.push('<p><b>Quyết định 47 yêu cầu:</b> ' + esc(h.qd) + '</p>');
    if (tc.kieu === 'dv') parts.push('<p><b>Cách nhập:</b> ghi số, ký hiệu, ngày, trích yếu các văn bản dưới đây vào ô "Văn bản, tài liệu minh chứng", bấm Gửi dữ liệu và tải lên <b>01 tệp PDF ghép tất cả</b> các văn bản đó (theo thứ tự đã ghi). Đã tải tệp minh chứng là đơn vị <b>đã thực hiện</b>. Không thuộc diện thì đánh dấu ô "không thuộc diện" và ghi lý do.</p>');
    else if (h.lam) parts.push('<p><b>Cách nhập:</b> ' + esc(h.lam) + '</p>');
    if ((h.tl || []).length) parts.push('<p><b>Văn bản, tài liệu cần tải lên</b> (ban hành trong kỳ 15/12/2025 – 14/12/2026; ghép thành 01 tệp PDF):</p><ul>' + h.tl.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
    if (h.loi) parts.push('<p class="loi"><b>Tránh lỗi:</b> ' + esc(h.loi) + '</p>');
    if (h.luuY) parts.push('<p><b>Lưu ý:</b> ' + esc(h.luuY) + '</p>');
    if (h.canCu) parts.push('<p class="muted"><b>Căn cứ:</b> ' + esc(h.canCu) + '</p>');
    return '<div class="hd">' + parts.join('') + '</div>';
  }

  function filesHtml(tc) {
    var can = st.hs.duocSua;
    var list = (tc.files || []).map(function (f) {
      var ten = f.url && f.url !== '#' ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener" title="Mở tệp trên Google Drive">' + esc(f.ten) + '</a>' : esc(f.ten);
      return '<li><span>📄 ' + ten + (f.tenGoc ? ' <span class="muted">- tên gốc: ' + esc(f.tenGoc) + '</span>' : '') + ' <span class="muted">(' + esc(f.kb) + ' KB, ' + esc(f.thoiGian) + ')</span></span>' +
        (can ? '<button type="button" class="btn nho vien" data-del="' + esc(f.fileId) + '" data-ma="' + esc(tc.ma) + '">Xóa</button>' : '') + '</li>';
    }).join('');
    if (list && st.hs.xem) list += '<li class="muted">Chế độ xem chỉ hiện tên tệp; tệp minh chứng không mở được từ đây.</li>';
    return '<div class="files" id="files_' + tc.ma.replace(/\W/g, '_') + '"><b>' + PACA_NHAN_TEP + '</b>' +
      '<ul>' + (list || '<li class="muted">Chưa có tệp.</li>') + '</ul>' +
      (can ? '<p class="muted" style="margin:4px 0">Ghép tất cả văn bản, tài liệu minh chứng của tiêu chí thành <b>01 tệp PDF</b> rồi tải lên. Tải tệp mới sẽ <b>thay thế</b> tệp đang có.</p>' : '') +
      (can ? '<input type="file" accept="application/pdf,.pdf" data-up="' + esc(tc.ma) + '">' : '') + '</div>';
  }

  function isFilled(tc) {
    return Object.keys(tc.values || {}).some(function (k) { return k !== 'ghiChu' && tc.values[k] !== '' && tc.values[k] != null; });
  }

  function chips(tc) {
    if (tc.kieu === 'dv') return dvChips(tc);
    var c = isFilled(tc) ? '<span class="badge ok">Đã nhập</span>' : (tc.tuyChon ? '<span class="badge">Nếu có</span>' : '<span class="badge err">Chưa nhập</span>');
    c += nhomBadge(tc);
    if ((tc.files || []).length) c += ' <span class="badge">' + tc.files.length + ' tệp</span>';
    if (tc.thamDinh) c += ' <span class="badge ' + (tc.thamDinh === 'Đạt' ? 'ok' : 'warn') + '">TĐ: ' + esc(tc.thamDinh) + '</span>';
    return c;
  }

  /** Tiêu chí kiểu dv: trạng thái tính từ văn bản + tệp (giống cách máy chủ chấm). */
  function dvChips(tc) {
    var tt = pacaDvTrangThai(tc.values, (tc.files || []).length);
    var c = tt === 'DA' ? '<span class="badge ok">Đã thực hiện</span>' :
      tt === 'KTD' ? '<span class="badge">Không thuộc diện</span>' :
      tt === 'THIEU_TEP' ? '<span class="badge warn">Có văn bản, chưa tải tệp</span>' :
      (tc.tuyChon ? '<span class="badge">Nếu có</span>' : '<span class="badge err">Chưa nhập</span>');
    c += nhomBadge(tc);
    if ((tc.files || []).length) c += ' <span class="badge">' + tc.files.length + ' tệp</span>';
    if (tc.thamDinh) c += ' <span class="badge ' + (tc.thamDinh === 'Đạt' ? 'ok' : 'warn') + '">TĐ: ' + esc(tc.thamDinh) + '</span>';
    return c;
  }

  function renderCriteria() {
    var hs = st.hs, html = '', lastTop = '', lastSub = '';
    hs.tieuChi.forEach(function (tc) {
      var parts = tc.ma.split('.');
      var top = parts[0];
      if (top !== lastTop) {
        html += '<div class="nhom1">' + esc(top) + '. ' + esc(hs.nhom[top] || '') + '</div>';
        lastTop = top; lastSub = '';
      }
      var sub = parts.length > 2 ? parts.slice(0, parts.length - 1).join('.') : '';
      if (sub && sub !== lastSub && hs.nhom[sub]) {
        html += '<div class="nhom2">' + esc(sub) + '. ' + esc(hs.nhom[sub]) + '</div>';
        lastSub = sub;
      }
      var dis = !hs.duocSua;
      html += '<details class="tc" data-tc="' + esc(tc.ma) + '"><summary><span class="ma">' + esc(tc.ma) + '</span>' +
        '<span class="ten">' + esc(tc.ten) + '<br><span class="chips">' + chips(tc) + '</span></span>' +
        '<span class="diem">' + fmtNum(tc.max) + ' điểm</span></summary><div class="tc-body"><div>' +
        (tc.yKien ? '<div class="yk"><b>Ý kiến rà soát của Tổ công tác đánh giá:</b> ' + esc(tc.yKien) + '</div>' : '') +
        tc.fields.map(function (f) { return inputHtml(tc, f, dis); }).join('') +
        filesHtml(tc) + '</div><div>' + hdHtml(tc) + '</div></div></details>';
    });
    if (!hs.tieuChi.length) html = '<div class="alert info">Đơn vị chưa được giao tiêu chí nào trên hệ thống. Nếu Thanh tra tỉnh đề nghị cung cấp số liệu, vui lòng liên hệ nhóm Zalo "Nhóm nhập liệu TD, GQKNTC, TT, Thanh tra CQ 2 cấp" (https://zalo.me/g/ksevyr941).</div>';
    $('#criteria').innerHTML = html;
    $$('#criteria [data-ma][data-k]').forEach(function (el) {
      el.addEventListener('input', onEdit);
      el.addEventListener('change', onEdit);
    });
    $$('#criteria [data-up]').forEach(function (el) { el.addEventListener('change', onUpload); });
    $('#criteria').onclick = onDeleteClick;
  }

  function tcByMa(ma) {
    return st.hs.tieuChi.filter(function (t) { return t.ma === ma; })[0];
  }

  function onEdit(e) {
    var el = e.target, tc = tcByMa(el.dataset.ma);
    var v = el.type === 'checkbox' ? (el.checked ? 'Có' : '') : el.value.trim();
    tc.values[el.dataset.k] = v;
    if (el.dataset.type === 'number' || el.dataset.type === 'money') {
      el.style.borderColor = v && !/^[\d\s.,]+$/.test(v) ? '#dc2626' : '';
    }
    markDirty(true);
    var sum = $('details[data-tc="' + tc.ma + '"] .chips');
    if (sum) sum.innerHTML = chips(tc);
    updateProgress();
  }

  function markDirty(d) {
    st.dirty = d;
    $('#dirty').classList.toggle('hidden', !d);
    if (d) henLuuNhap(); else xoaNhap();
  }

  // ---------------- Bản nháp trên máy (phòng mất mạng, mất điện, đóng nhầm trang) ----------------
  var henNhap = null;
  function khoaNhap() { return st.hs ? 'paca2026_nhap_' + st.hs.donVi.ma : ''; }
  function henLuuNhap() {
    clearTimeout(henNhap);
    henNhap = setTimeout(luuNhap, 600);
  }
  function luuNhap() {
    if (!st.hs || !st.dirty || !st.hs.duocSua) return;
    try { localStorage.setItem(khoaNhap(), JSON.stringify(Object.assign(collect(), { luc: new Date().toLocaleString('vi-VN') }))); } catch (e) { /* bộ nhớ đầy: bỏ qua */ }
  }
  function xoaNhap() {
    clearTimeout(henNhap);
    if (st.hs) try { localStorage.removeItem(khoaNhap()); } catch (e) {}
  }
  function docNhap() {
    try { return JSON.parse(localStorage.getItem(khoaNhap()) || 'null'); } catch (e) { return null; }
  }
  /** Sau khi đăng nhập: còn bản nháp chưa gửi thì hỏi khôi phục. */
  function hoiKhoiPhuc() {
    var box = $('#draftNote'), n = docNhap();
    box.innerHTML = '';
    if (!n || !st.hs.duocSua) return;
    box.innerHTML = '<div class="alert warn"><b>Máy này còn phần nhập dở chưa gửi</b> (lưu nháp lúc ' + esc(n.luc) + '). ' +
      'Khôi phục để tiếp tục, kiểm tra lại rồi bấm "Gửi dữ liệu".' +
      '<div class="tools" style="margin-top:8px"><button class="btn nho" id="btnKhoiPhuc" type="button">Khôi phục phần nhập dở</button>' +
      '<button class="btn phu nho" id="btnBoNhap" type="button">Bỏ bản nháp</button></div></div>';
    $('#btnKhoiPhuc').onclick = function () {
      st.hs.tieuChi.forEach(function (tc) { if (n.duLieu && n.duLieu[tc.ma]) tc.values = Object.assign({}, n.duLieu[tc.ma]); });
      if (n.vuViec && st.hs.coSoVuViec) st.vv = n.vuViec;
      var t = n.thongTin || {};
      if (t.nguoiNhap) $('#nguoiNhap').value = t.nguoiNhap;
      if (t.dienThoai) $('#dienThoai').value = t.dienThoai;
      if (t.email) $('#email').value = t.email;
      renderCriteria(); renderVuViec(); updateProgress();
      markDirty(true);
      box.innerHTML = '';
      msg('Đã khôi phục phần nhập dở. Kiểm tra lại rồi bấm "Gửi dữ liệu".', 'warn');
    };
    $('#btnBoNhap').onclick = function () { xoaNhap(); box.innerHTML = ''; };
  }

  function updateProgress() {
    var list = st.hs.tieuChi.filter(function (t) { return !t.tuyChon; });
    var n = list.filter(isFilled).length;
    var nTuyChon = st.hs.tieuChi.length - list.length;
    $('#progTxt').textContent = n + '/' + list.length + ' tiêu chí bắt buộc đã nhập' + (nTuyChon ? ' (chưa tính ' + nTuyChon + ' tiêu chí điểm cộng, nếu có)' : '');
    $('#progBar').style.width = (list.length ? Math.round(n / list.length * 100) : 0) + '%';
  }

  function collect() {
    var data = {};
    st.hs.tieuChi.forEach(function (tc) {
      var out = {};
      tc.fields.forEach(function (f) {
        var v = tc.values[f.k];
        if (v !== '' && v != null) out[f.k] = v;
      });
      data[tc.ma] = out;
    });
    return {
      thongTin: { nguoiNhap: $('#nguoiNhap').value.trim(), dienThoai: $('#dienThoai').value.trim(), email: $('#email').value.trim() },
      duLieu: data,
      vuViec: st.hs.coSoVuViec ? st.vv : undefined
    };
  }

  function save(silent) {
    if (st.saving) return Promise.resolve();
    var p = collect();
    if (!p.thongTin.nguoiNhap || !p.thongTin.dienThoai) {
      msg('Vui lòng nhập họ tên và số điện thoại người nhập liệu (đầu trang).', 'warn');
      $('#nguoiNhap').focus();
      return Promise.reject(new Error('thiếu thông tin'));
    }
    st.saving = true;
    $('#btnSave').disabled = true;
    msg('Đang gửi dữ liệu...', 'info');
    return api('luu', p).then(function (res) {
      markDirty(false);
      st.hs.donVi.nguoiNhap = p.thongTin.nguoiNhap; st.hs.donVi.dienThoai = p.thongTin.dienThoai;
      st.hs.donVi.trangThai = 'Đã gửi'; st.hs.donVi.nopLuc = res.capNhatLuc; renderHeader();
      if (!silent) msg(res.message + ' Lúc ' + res.capNhatLuc + '.', 'ok');
    }).catch(function (e) { msg('Chưa gửi được: ' + e.message, 'err'); throw e; })
      .then(function () { st.saving = false; $('#btnSave').disabled = !st.hs.duocSua; });
  }


  function onUpload(e) {
    var input = e.target, ma = input.dataset.up, files = Array.prototype.slice.call(input.files || []);
    var maxB = PACA_FILE_MB * 1024 * 1024;
    var chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () {
        if (!/\.pdf$/i.test(file.name)) { msg('Bỏ qua "' + file.name + '": chỉ nhận tệp PDF.', 'warn'); return; }
        if (file.size > maxB) { msg('Bỏ qua "' + file.name + '": vượt quá ' + PACA_FILE_MB + ' MB.', 'warn'); return; }
        msg('Đang tải lên "' + file.name + '"...', 'info');
        return readB64(file).then(function (b64) {
          return api('taiLen', { ma: ma, tenFile: file.name, base64: b64 });
        }).then(function (res) {
          var tc = tcByMa(ma); tc.files = res.files;
          refreshFiles(tc);
          msg(res.message, 'ok');
        }).catch(function (err) { msg('Lỗi tải lên "' + file.name + '": ' + err.message, 'err'); });
      });
    });
    chain.then(function () { input.value = ''; });
  }

  function readB64(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(',')[1]); };
      r.onerror = function () { reject(new Error('Không đọc được tệp.')); };
      r.readAsDataURL(file);
    });
  }

  function refreshFiles(tc) {
    var box = $('#files_' + tc.ma.replace(/\W/g, '_'));
    var tmp = document.createElement('div');
    tmp.innerHTML = filesHtml(tc);
    box.replaceWith(tmp.firstChild);
    var up = $('[data-up="' + tc.ma + '"]');
    if (up) up.addEventListener('change', onUpload);
    var sum = $('details[data-tc="' + tc.ma + '"] .chips');
    if (sum) sum.innerHTML = chips(tc);
  }

  /** Xóa tệp: bấm 2 lần để xác nhận (không dùng hộp thoại trình duyệt). */
  function onDeleteClick(e) {
    var b = e.target.closest('[data-del]');
    if (!b) return;
    if (!b.dataset.confirm) {
      b.dataset.confirm = '1'; b.textContent = 'Bấm lần nữa để xóa'; b.classList.add('do');
      setTimeout(function () { if (b.isConnected) { delete b.dataset.confirm; b.textContent = 'Xóa'; b.classList.remove('do'); } }, 4000);
      return;
    }
    b.disabled = true;
    api('xoaFile', { fileId: b.dataset.del }).then(function (res) {
      var tc = tcByMa(b.dataset.ma); tc.files = res.files; refreshFiles(tc); msg(res.message, 'ok');
    }).catch(function (err) { b.disabled = false; msg('Không xóa được: ' + err.message, 'err'); });
  }

  // ---------------- Sổ vụ việc ----------------
  function vvInput(f, v, i, dis) {
    var a = ' data-vv="' + i + '" data-k="' + f.k + '" data-type="' + f.type + '"' + (dis ? ' disabled' : '');
    v = v == null ? '' : v;
    if (f.type === 'select') {
      return '<select' + a + '><option value="">-- Chọn --</option>' + f.options.map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (o.v === v ? ' selected' : '') + '>' + esc(o.t) + '</option>';
      }).join('') + '</select>';
    }
    if (f.type === 'number' || f.type === 'money') return '<input type="text" inputmode="decimal" autocomplete="off"' + a + ' value="' + esc(fmtNum(v)) + '">';
    if (f.w === 'rong') return '<textarea' + a + ' maxlength="1000" style="min-height:44px">' + esc(v) + '</textarea>';
    return '<input type="text" maxlength="1000"' + a + ' value="' + esc(v) + '">';
  }

  function renderVuViec() {
    var box = $('#vuViecBox');
    if (!box) return;
    var hs = st.hs;
    if (!hs.coSoVuViec) { box.innerHTML = ''; return; }
    var F = hs.vuViecFields, dis = !hs.duocSua;
    var items = st.vv.map(function (r, i) {
      return '<div class="vv"><div class="tools" style="justify-content:space-between"><b>Vụ việc ' + (i + 1) + '</b>' +
        (dis ? '' : '<button type="button" class="btn nho vien" data-vvdel="' + i + '">Xóa dòng</button>') + '</div><div class="vv-grid">' +
        F.map(function (f) { return '<div class="' + (f.w === 'rong' ? 'rong' : '') + '"><label>' + esc(f.t) + '</label>' + vvInput(f, r[f.k], i, dis) + '</div>'; }).join('') +
        '</div></div>';
    }).join('');
    box.innerHTML = '<div class="nhom1">SỔ VỤ VIỆC THAM NHŨNG, LÃNG PHÍ, TIÊU CỰC PHÁT HIỆN TRONG KỲ (phục vụ C.1, C.2, D.1, D.2, D.4)</div>' +
      '<div class="card"><div class="alert warn" style="margin-top:0">Mỗi vụ việc phát hiện trong kỳ ghi <b>một dòng</b>. <b>Không ghi họ tên, chức vụ cụ thể, ' +
      'số giấy tờ hay thông tin nhận dạng cá nhân</b>; chỉ tóm tắt nội dung (ví dụ: "Sai phạm trong quản lý, sử dụng đất tại thôn X"). ' +
      'Vụ việc đang xác minh có yêu cầu giữ bí mật hoặc có nội dung mật thì không kê khai tại đây. Nếu không có vụ việc, để trống.</div>' +
      (items || '<p class="muted">Chưa kê khai vụ việc nào.</p>') +
      (dis ? '' : '<button type="button" class="btn nho" id="btnVvAdd">+ Thêm vụ việc</button>') +
      '<div id="vvDoiChieu" style="margin-top:12px"></div></div>';
    $$('#vuViecBox [data-vv]').forEach(function (el) { el.addEventListener('input', onVvEdit); el.addEventListener('change', onVvEdit); });
    $$('#vuViecBox [data-vvdel]').forEach(function (b) {
      b.addEventListener('click', function () { st.vv.splice(Number(b.dataset.vvdel), 1); markDirty(true); renderVuViec(); });
    });
    var add = $('#btnVvAdd');
    if (add) add.addEventListener('click', function () {
      if (st.vv.length >= 200) { msg('Sổ vụ việc tối đa 200 dòng.', 'warn'); return; }
      st.vv.push({}); markDirty(true); renderVuViec();
      var last = $$('#vuViecBox .vv').pop(); if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    renderDoiChieu();
  }

  function onVvEdit(e) {
    var el = e.target, r = st.vv[Number(el.dataset.vv)], v = el.value.trim();
    if (v === '') delete r[el.dataset.k]; else r[el.dataset.k] = v;
    if (el.dataset.type === 'number' || el.dataset.type === 'money') el.style.borderColor = v && !/^[ds.,]+$/.test(v) ? '#dc2626' : '';
    markDirty(true);
    renderDoiChieu();
  }

  function vnNum(v) {
    if (typeof v === 'number') return v;
    var s = String(v == null ? '' : v).replace(/s/g, '');
    if (/^d{1,3}(.d{3})+$/.test(s)) s = s.replace(/./g, '');
    s = s.replace(',', '.');
    var n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  function renderDoiChieu() {
    var box = $('#vvDoiChieu');
    if (!box || typeof pacaDoiChieuVuViec !== 'function') return;
    var vals = {};
    st.hs.tieuChi.forEach(function (tc) { vals[tc.ma] = tc.values; });
    var rows = pacaDoiChieuVuViec(st.vv, vals, vnNum);
    var lech = rows.filter(function (r) { return r.lech; }).length;
    box.innerHTML = '<details' + (lech ? ' open' : '') + '><summary class="muted" style="cursor:pointer">Đối chiếu sổ vụ việc với số liệu tổng hợp đã khai' +
      (lech ? ' — <b style="color:#b45309">' + lech + ' nội dung chênh lệch, đề nghị kiểm tra</b>' : ' — khớp') + '</summary>' +
      '<table class="dc"><tr><th>Nội dung</th><th>Theo sổ vụ việc</th><th>Số đã khai</th><th>Tiêu chí</th></tr>' +
      rows.map(function (r) {
        return '<tr' + (r.lech ? ' class="lech"' : '') + '><td>' + esc(r.noiDung) + '</td><td>' + fmtNum(r.soVuViec) + '</td><td>' + fmtNum(r.soKhai) + '</td><td>' + esc(r.tieuChi) + '</td></tr>';
      }).join('') + '</table><p class="muted">Chênh lệch có thể hợp lý (một cuộc thanh tra phát hiện nhiều vụ việc...). Khi đó ghi giải trình ở tiêu chí tương ứng.</p></details>';
  }

  // ---------------- Xuất phiếu ----------------
  function exportPhieu(kind) {
    if (!window.PACA_PHIEU) { msg('Chưa nạp được mô-đun xuất biểu.', 'err'); return; }
    var hs = Object.assign({}, st.hs, { vuViec: st.vv });
    hs.donVi = Object.assign({}, st.hs.donVi, { nguoiNhap: $('#nguoiNhap').value.trim(), dienThoai: $('#dienThoai').value.trim(), email: $('#email').value.trim() });
    if (kind === 'word') { window.PACA_PHIEU.word(hs); msg('Đã tạo tệp Word' + (st.dirty ? ' (gồm cả nội dung chưa gửi - nhớ bấm Gửi dữ liệu)' : '') + '.', 'ok'); }
    else if (!window.PACA_PHIEU.pdf(hs)) msg('Trình duyệt chặn cửa sổ mới. Cho phép cửa sổ bật lên (pop-up) cho trang này rồi bấm lại.', 'warn');
  }

  function bindGlobal() {
    $('#btnWord').addEventListener('click', function () { exportPhieu('word'); });
    $('#btnSave').addEventListener('click', function () { save(false).catch(function () {}); });
    $('#btnLogout').addEventListener('click', function () { logout(false); });
    $('#btnExpand').addEventListener('click', function () {
      var open = $$('details.tc').some(function (d) { return !d.open; });
      $$('details.tc').forEach(function (d) { d.open = open; });
    });
    $('#btnMissing').addEventListener('click', function () {
      var first = null;
      $$('details.tc').forEach(function (d) {
        var tc = tcByMa(d.dataset.tc);
        d.open = !isFilled(tc) && !tc.tuyChon;
        if (d.open && !first) first = d;
      });
      if (first) first.scrollIntoView({ behavior: 'smooth' }); else msg('Đã nhập đủ các tiêu chí.', 'ok');
    });
    ['#nguoiNhap', '#dienThoai', '#email'].forEach(function (s) { $(s).addEventListener('input', function () { markDirty(true); }); });
    window.addEventListener('beforeunload', function (e) { if (st.dirty) { luuNhap(); e.preventDefault(); e.returnValue = ''; } });
    var bao = function () {
      var off = navigator.onLine === false;
      $('#netNote').classList.toggle('hidden', !off);
      if (!off && st.hs && st.dirty) msg('Đã có mạng trở lại. Bấm "Gửi dữ liệu" để gửi phần chưa gửi.', 'warn');
    };
    window.addEventListener('offline', bao);
    window.addEventListener('online', bao);
    if (navigator.onLine === false) $('#netNote').classList.remove('hidden');
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && st.hs && st.hs.duocSua) { e.preventDefault(); save(false).catch(function () {}); }
    });
  }

  function start() {
    if (XEM) document.body.insertAdjacentHTML('afterbegin', '<div class="demo-flag">CHẾ ĐỘ XEM - nội dung đơn vị đã gửi, để tham khảo; không nhập, không gửi được dữ liệu. ' +
      'Để nhập thật: <a href="index.html" style="color:#fff;text-decoration:underline">đăng nhập bằng mã truy cập của đơn vị</a>.</div>');
    else if (DEMO) document.body.insertAdjacentHTML('afterbegin', '<div class="demo-flag">CHẾ ĐỘ THỬ NGHIỆM - dữ liệu chỉ lưu trên trình duyệt này, không gửi về máy chủ. Mã truy cập thử: DEMO</div>');
    bindGlobal();
    initLogin();
    var dvXem = (location.search.match(/[?&]dv=([^&]+)/) || [])[1];
    if (XEM && dvXem) {
      var dvMa = decodeURIComponent(dvXem);
      (DEMO ? api('dangNhap', { maDonVi: dvMa, maTruyCap: 'DEMO' }) : api('xemDonVi', { maDonVi: dvMa })).then(function (res) {
        if (DEMO) { st.token = res.token; sessionStorage.setItem(KEY, res.token); res.duocSua = false; }
        showForm(res);
      }).catch(function (e) { $('#loginNote').innerHTML = '<div class="alert err">' + esc(e.message) + '</div>'; });
      return;
    }
    var tk = sessionStorage.getItem(KEY);
    if (tk) {
      st.token = tk;
      api('hoSo', {}).then(showForm).catch(function () { st.token = ''; sessionStorage.removeItem(KEY); });
    }
  }

  if (DEMO && !window.PACA_DEMO_API) {
    var s = document.createElement('script');
    s.src = 'demo/demo-loader.js';
    s.onload = function () { window.PACA_DEMO_READY.then(start); };
    document.head.appendChild(s);
  } else {
    document.addEventListener('DOMContentLoaded', start);
  }
})();
