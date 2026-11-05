/* Chế độ thử nghiệm (?demo=1): nạp chính các tệp tiêu chí/đơn vị/chấm điểm của máy chủ (thư mục gas/)
 * và giả lập API trên trình duyệt. Dữ liệu lưu ở localStorage. Không gửi gì ra ngoài. */
(function () {
  var base = (document.currentScript && document.currentScript.src || '').replace(/web\/demo\/demo-loader\.js.*$/, '');
  var files = ['gas/01_Criteria.js', 'gas/02_HuongDan.js', 'gas/02b_HuongDanDonVi.js', 'gas/03_Units.js', 'gas/04_Scoring.js', 'gas/05_Form.js', 'gas/01c_PhuLucII.js', 'gas/06_PhuLuc02.js'];
  function load(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = base + src; s.onload = res; s.onerror = function () { rej(new Error('Không nạp được ' + src)); };
      document.head.appendChild(s);
    });
  }
  window.PACA_DEMO_READY = files.reduce(function (p, f) { return p.then(function () { return load(f); }); }, Promise.resolve())
    .then(function () { window.PACA_DEMO_API = demoApi; });

  var DB = 'paca2026_demo_db';
  function db() {
    var d;
    try { d = window.PACA_XEM ? null : JSON.parse(localStorage.getItem(DB)); } catch (e) { d = null; }
    d = d || {};
    ['data', 'files', 'units', 'vv', 'rv', 'tinh'].forEach(function (k) { d[k] = d[k] || {}; });
    return d;
  }
  function put(d) { localStorage.setItem(DB, JSON.stringify(d)); }
  function now() { return new Date().toLocaleString('vi-VN'); }
  function unitOf(ma) { return PACA_UNITS_SEED.filter(function (u) { return u.ma === ma; })[0]; }

  function hoSo(ma) {
    var d = db(), u = unitOf(ma), info = d.units[ma] || {};
    var data = {};
    Object.keys(d.data[ma] || {}).forEach(function (k) { data[k] = { values: d.data[ma][k] }; });
    Object.keys(d.rv[ma] || {}).forEach(function (k) {
      var r = d.rv[ma][k];
      data[k] = Object.assign(data[k] || { values: {} }, { reviewLabel: r.label, yKien: r.yKien, nguoiThamDinh: r.nguoi, suaSau: r.suaSau });
    });
    var tt = info.trangThai || 'Chưa gửi';
    return {
      success: true,
      donVi: { ma: u.ma, ten: u.ten, loai: u.loai, nhom: u.nhom, trangThai: tt, nopLuc: info.nopLuc || '',
        nguoiNhap: info.nguoiNhap || '', dienThoai: info.dienThoai || '', email: info.email || '' },
      duocSua: !window.PACA_XEM, lyDoKhoa: window.PACA_XEM ? 'Chế độ xem thử: chỉ xem cách nhập, không nhập, không gửi được dữ liệu. Mở từng tiêu chí để đọc hướng dẫn và các ô cần nhập.' : '',
      hanNop: '20/12/2026 23:59', kySoLieu: '15/12/2025 - 14/12/2026', nam: '2026',
      nhom: pacaGroupNames(), tieuChi: pacaFormList(Object.assign({ hoatDong: true }, u), data, d.files[ma] || {}),
      coSoVuViec: pacaCoSoVuViec(u), vuViecFields: PACA_VU_VIEC_FIELDS, vuViec: d.vv[ma] || []
    };
  }

  function td(req, d) {
    if (req.action === 'tdDangNhap') {
      if (String(req.ma).toUpperCase() !== 'DEMO') return { success: false, message: 'Mã rà soát không đúng (thử nghiệm: DEMO).' };
      var r0 = tongQuan(d); r0.token = 'tddemo'; r0.ten = req.ten; return r0;
    }
    if (req.token !== 'tddemo') return { success: false, hetPhien: true, message: 'Phiên rà soát đã hết hạn.' };
    if (req.action === 'tdTongQuan') return tongQuan(d);
    if (req.action === 'tdDangXuat') return { success: true };
    if (req.action === 'tdDonVi') {
      var hs = hoSo(req.maDonVi), vals = {};
      hs.tieuChi.forEach(function (t) { vals[t.ma] = t.values; });
      hs.doiChieu = hs.coSoVuViec ? pacaDoiChieuVuViec(hs.vuViec, vals, pacaNum) : [];
      hs.tdLabels = ['Đạt', 'Không đạt', 'Không thuộc diện', 'Yêu cầu bổ sung'];
      return hs;
    }
    if (req.action === 'tdLuu') {
      if ((req.thamDinh === 'Yêu cầu bổ sung' || req.thamDinh === 'Không đạt') && !req.yKien) return { success: false, message: 'Cần ghi ý kiến khi chọn "' + req.thamDinh + '".' };
      var nguoi = 'Thử nghiệm - ' + now();
      (d.rv[req.maDonVi] = d.rv[req.maDonVi] || {})[req.ma] = { label: req.thamDinh, yKien: req.yKien, nguoi: req.thamDinh ? nguoi : '' };
      put(d);
      return { success: true, message: 'Đã ghi rà soát ' + req.ma + ' (thử nghiệm).', nguoiThamDinh: req.thamDinh ? nguoi : '' };
    }
    if (req.action === 'tdTinh') {
      var tq = tongQuan(d);
      var tinhIn = {}, chungIn = {};
      Object.keys(d.tinh).forEach(function (ma) { if (ma === 'CHUNG') chungIn = d.tinh[ma].values; else tinhIn[ma] = d.tinh[ma].values; });
      tinhIn = pacaTinhTuVanBan(PACA_CRITERIA, tinhIn, d.tinh, d.files.TINH || {});
      var units = PACA_UNITS_SEED.map(function (u) { return Object.assign({ hoatDong: true }, u); });
      var res = pacaScore({ criteria: PACA_CRITERIA, units: units, unitData: tq.__unitData, tinh: tinhIn, chung: chungIn });
      var fl = d.files.TINH || {};
      return { success: true, items: pacaTinhItems(d.tinh, fl), luc: now(), tong: res.tong,
        bang: res.rows.map(function (r) { return Object.assign({}, r, { soDat: r.dsDat.length, soChua: r.dsChuaDat.length }); }),
        pl02: pacaPL02Rows(res.rows, PACA_PL2, pacaMinhChungMap(Object.keys(d.files).reduce(function (a, u) {
          Object.keys(d.files[u]).forEach(function (ma) { d.files[u][ma].forEach(function (f) { a.push({ maDv: u, ma: ma, url: f.url || '#' }); }); }); return a;
        }, []), PACA_UNITS_SEED)) };
    }
    if (req.action === 'tdLuuTinh') {
      var ng = 'Thử nghiệm - ' + now();
      d.tinh[req.ma] = { values: req.values || {}, vanBan: req.vanBan, ghiChu: req.ghiChu, nguoi: ng }; put(d);
      return { success: true, message: 'Đã ghi ' + req.ma + ' (thử nghiệm).', nguoi: ng };
    }
    if (req.action === 'tdTaiLenTinh') {
      var ft = (d.files.TINH = d.files.TINH || {});
      ft[req.ma] = [];
      ft[req.ma].push({ fileId: 'demo' + Date.now(), ten: pacaTenTep({ ma: PACA_MA_TINH }, pacaSttTiep(ft[req.ma].map(function (x) { return x.ten; })), req.tenFile), tenGoc: req.tenFile, kb: Math.round(req.base64.length * 0.75 / 1024), thoiGian: now(), url: '#' });
      put(d); return { success: true, message: 'Đã tải lên (thử nghiệm).', files: ft[req.ma] };
    }
    if (req.action === 'tdXoaFileTinh') {
      var all = d.files.TINH || {}, k2;
      Object.keys(all).forEach(function (k) { all[k] = all[k].filter(function (x) { if (x.fileId === req.fileId) k2 = k; return x.fileId !== req.fileId; }); });
      put(d); return { success: true, message: 'Đã xóa tệp.', files: all[k2] || [] };
    }
    return { success: false, message: 'Chế độ thử nghiệm không hỗ trợ xuất phụ biểu (chức năng chạy trên máy chủ).' };
  }

  function tongQuan(d) {
    var units = PACA_UNITS_SEED.map(function (u) { return Object.assign({ hoatDong: true }, u); });
    var unitData = {};
    var list = units.map(function (u) {
      var vals = d.data[u.ma] || {}, rv = d.rv[u.ma] || {}, crit = pacaCriteriaForUnit(u);
      var filled = function (ma) { var v = vals[ma] || {}; return Object.keys(v).some(function (k) { return k !== 'ghiChu' && v[k] !== ''; }); };
      var bb = crit.filter(function (x) { return !pacaIsOptional(x); });
      var tk = { daNhap: bb.filter(function (x) { return filled(x.c.ma); }).length, phaiNhap: bb.length, daThamDinh: 0, cho: 0, boSung: 0, khongDat: 0 };
      crit.forEach(function (x) {
        var r = rv[x.c.ma] || {};
        if (r.label === 'Yêu cầu bổ sung') tk.boSung++; else if (r.label) { tk.daThamDinh++; if (r.label === 'Không đạt') tk.khongDat++; }
        if (filled(x.c.ma) && (!r.label || r.suaSau)) tk.cho++;
        var map = { 'Đạt': 'DAT', 'Không đạt': 'KHONG_DAT', 'Không thuộc diện': 'KHONG_THUOC_DIEN', 'Yêu cầu bổ sung': 'BO_SUNG' };
        var nTep = ((d.files[u.ma] || {})[x.c.ma] || []).length;
        if (vals[x.c.ma] || r.label || nTep) (unitData[u.ma] = unitData[u.ma] || {})[x.c.ma] = { values: vals[x.c.ma] || {}, review: map[r.label] || '', soFile: nTep };
      });
      var info = d.units[u.ma] || {};
      var nf = Object.keys(d.files[u.ma] || {}).reduce(function (s, k) { return s + d.files[u.ma][k].length; }, 0);
      return { ma: u.ma, ten: u.ten, loai: u.loai, nhom: u.nhom, trangThai: info.trangThai || 'Chưa gửi', nopLuc: info.nopLuc || '', capNhatLuc: '',
        soFile: nf, soVuViec: (d.vv[u.ma] || []).length, tk: tk };
    });
    var tinhIn = {}, chungIn = {};
    Object.keys(d.tinh).forEach(function (ma) { if (ma === 'CHUNG') chungIn = d.tinh[ma].values; else tinhIn[ma] = d.tinh[ma].values; });
    tinhIn = pacaTinhTuVanBan(PACA_CRITERIA, tinhIn, d.tinh, d.files.TINH || {});
    var tong = pacaScore({ criteria: PACA_CRITERIA, units: units, unitData: unitData, tinh: tinhIn, chung: chungIn }).tong;
    var out = { success: true, donVi: list.filter(function (u) { return u.ma !== 'TINH'; }), tong: tong, luc: now(), thuMucMinhChung: '', nam: '2026', kySoLieu: '15/12/2025 - 14/12/2026' };
    Object.defineProperty(out, '__unitData', { value: unitData, enumerable: false });
    return out;
  }

  function demoApi(req) {
    return new Promise(function (resolve) { setTimeout(function () { resolve(handle(req)); }, 250); });
  }

  function handle(req) {
    try {
      var d = db();
      if (req.action === 'danhMuc') {
        var loai = req.loai === 'XA' ? ['XA'] : req.loai === 'TAT_CA' ? ['SO', 'XA'] : ['SO'];
        return { success: true, nam: '2026', kySoLieu: '15/12/2025 - 14/12/2026', hanNop: '20/12/2026 23:59', moNhap: true,
          donVi: PACA_UNITS_SEED.filter(function (u) { return loai.indexOf(u.loai) >= 0; }) };
      }
      if (req.action === 'dangNhap') {
        if (String(req.maTruyCap).toUpperCase() !== 'DEMO') return { success: false, message: 'Mã truy cập không đúng (thử nghiệm: DEMO).' };
        var r = hoSo(req.maDonVi); r.token = 'demo:' + req.maDonVi; return r;
      }
      if (/^td/.test(req.action)) return td(req, d);
      var ma = String(req.token || '').replace('demo:', '');
      if (!unitOf(ma)) return { success: false, hetPhien: true, message: 'Phiên làm việc đã hết hạn.' };
      if (req.action === 'hoSo') return hoSo(ma);
      if (req.action === 'dangXuat') return { success: true };
      if (window.PACA_XEM) return { success: false, message: 'Chế độ xem thử: không nhập, không gửi được dữ liệu.' };
      var info = d.units[ma] = d.units[ma] || {};
      if (req.action === 'luu') {
        Object.assign(info, req.thongTin, { trangThai: 'Đã gửi', nopLuc: now() });
        if (req.vuViec) d.vv[ma] = pacaCleanVuViec(req.vuViec, pacaNum);
        Object.keys(req.duLieu || {}).forEach(function (k) {
          if (JSON.stringify((d.data[ma] || {})[k] || {}) !== JSON.stringify(req.duLieu[k]) && d.rv[ma] && d.rv[ma][k]) d.rv[ma][k].suaSau = true;
        });
        d.data[ma] = req.duLieu; put(d);
        return { success: true, message: 'Đã gửi dữ liệu (thử nghiệm).', capNhatLuc: now() };
      }
      if (req.action === 'taiLen') {
        var f = (d.files[ma] = d.files[ma] || {});
        f[req.ma] = [];
        var uTep = PACA_UNITS_SEED.filter(function (x) { return x.ma === ma; })[0] || { ma: ma, ten: ma };
        f[req.ma].push({ fileId: 'demo' + Date.now(), ten: pacaTenTep(uTep, pacaSttTiep(f[req.ma].map(function (x) { return x.ten; })), req.tenFile), tenGoc: req.tenFile, kb: Math.round(req.base64.length * 0.75 / 1024), thoiGian: now() });
        put(d);
        return { success: true, message: 'Đã tải lên (thử nghiệm, tệp không được lưu).', files: f[req.ma] };
      }
      if (req.action === 'xoaFile') {
        var all = d.files[ma] || {}, k2;
        Object.keys(all).forEach(function (k) { all[k] = all[k].filter(function (x) { if (x.fileId === req.fileId) k2 = k; return x.fileId !== req.fileId; }); });
        put(d);
        return { success: true, message: 'Đã xóa tệp.', files: all[k2] || [] };
      }
      return { success: false, message: 'Thao tác không hợp lệ.' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
})();
