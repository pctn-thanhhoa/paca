/* PACA 2026 - trang chính: chọn một đơn vị (sở, ngành hoặc xã, phường), nhập mã truy cập,
 * rồi chuyển vào trang nhap-lieu.html (tiêu chí hiển thị theo đơn vị).
 * Phiên đăng nhập chuyển sang trang nhập liệu qua sessionStorage (khóa paca2026_tk, cùng tab). */
(function () {
  'use strict';
  var DEMO = /[?&]demo=1/.test(location.search);
  var URL_API = (window.PACA_CONFIG || {}).WEB_APP_URL || '';
  var units = [];
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /** Bỏ dấu tiếng Việt để tìm kiếm ("hoang" khớp "Hoằng"). */
  function khongDau(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  }
  function note(html) { $('#loginNote').innerHTML = html; }

  function api(action, payload) {
    var body = Object.assign({ action: action }, payload || {});
    var p = DEMO ? window.PACA_DEMO_API(body) :
      fetch(URL_API, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' })
        .then(function (r) { if (!r.ok) throw new Error('Lỗi kết nối máy chủ (' + r.status + ').'); return r.json(); });
    return p.then(function (res) {
      if (!res || !res.success) throw new Error((res && res.message) || 'Có lỗi xảy ra.');
      return res;
    });
  }

  /** Nhóm hiển thị: sở, ngành theo nhóm của danh mục; xã, phường chia Phường / Xã / Đặc khu, xếp theo tên. */
  function nhomCua(u) {
    if (u.loai !== 'XA') return u.nhom || 'Sở, ban, ngành';
    return /^Phường/i.test(u.ten) ? 'Phường' : /^Đặc khu/i.test(u.ten) ? 'Đặc khu' : 'Xã';
  }
  function boTien(t) { return String(t).replace(/^(Phường|Xã|Đặc khu)\s+/i, ''); }

  function renderSelect() {
    var q = khongDau($('#txtTim').value.trim());
    var cu = $('#selDonVi').value;
    var list = units.filter(function (u) { return !q || khongDau(u.ten).indexOf(q) >= 0; });
    var groups = {}, order = [];
    list.forEach(function (u) {
      var g = nhomCua(u);
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(u);
    });
    ['Phường', 'Xã', 'Đặc khu'].forEach(function (g) {
      if (groups[g]) groups[g].sort(function (a, b) { return boTien(a.ten).localeCompare(boTien(b.ten), 'vi', { sensitivity: 'base' }); });
    });
    order.sort(function (a, b) { return (['Phường', 'Xã', 'Đặc khu'].indexOf(a) >= 0) - (['Phường', 'Xã', 'Đặc khu'].indexOf(b) >= 0); });
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
    if (!ma || !code) { note('<div class="alert warn">Chọn đơn vị và nhập mã truy cập.</div>'); return; }
    var u = units.filter(function (x) { return x.ma === ma; })[0];
    if (!u) return;
    if (code === '000000') { location.href = 'nhap-lieu.html?xem=1&dv=' + encodeURIComponent(ma); return; }
    $('#btnLogin').disabled = true;
    note('<div class="alert info">Đang đăng nhập...</div>');
    api('dangNhap', { maDonVi: ma, maTruyCap: code }).then(function (res) {
      sessionStorage.setItem('paca2026_tk', res.token);
      location.href = 'nhap-lieu.html' + (DEMO ? '?demo=1' : '');
    }).catch(function (e) {
      note('<div class="alert err">' + esc(e.message) + '</div>');
      $('#btnLogin').disabled = false;
    });
  }

  function start() {
    if (DEMO) document.body.insertAdjacentHTML('afterbegin', '<div class="demo-flag">CHẾ ĐỘ THỬ NGHIỆM - dữ liệu chỉ lưu trên trình duyệt này, không gửi về máy chủ. Mã truy cập thử: DEMO</div>');
    if (!URL_API && !DEMO) { note('<div class="alert err">Chưa cấu hình địa chỉ máy chủ (assets/config.js).</div>'); return; }
    api('danhMuc', { loai: 'TAT_CA' }).then(function (res) {
      units = res.donVi || [];
      renderSelect();
      if (!res.moNhap) note('<div class="alert warn">Hệ thống đang tạm khóa nhập liệu.</div>');
    }).catch(function (e) { note('<div class="alert err">' + esc(e.message) + '</div>'); });
    $('#txtTim').addEventListener('input', renderSelect);
    $('#btnLogin').addEventListener('click', doLogin);
    $('#txtMa').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
  }

  if (DEMO) {
    var s = document.createElement('script');
    s.src = 'demo/demo-loader.js';
    s.onload = function () { window.PACA_DEMO_READY.then(start); };
    document.head.appendChild(s);
  } else {
    document.addEventListener('DOMContentLoaded', start);
  }
})();
