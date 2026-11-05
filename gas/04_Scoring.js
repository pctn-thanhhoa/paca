/**
 * BỘ CHẤM ĐIỂM - hàm thuần (không gọi dịch vụ Google), chạy được cả trên Apps Script và Node (kiểm thử).
 *
 * pacaScore(input) với input = {
 *   criteria: PACA_CRITERIA,
 *   units:    [{ ma, ten, loai: 'SO'|'XA'|'NOI_CHINH', hoatDong: true }],
 *   unitData: { [maDonVi]: { [maTieuChi]: { values: {k: v}, review: 'DAT'|'KHONG_DAT'|'KHONG_THUOC_DIEN'|'' } } },
 *   tinh:     { [maTieuChi]: {k: v} }        // sheet NHAP_TINH (Thanh tra tỉnh nhập/chốt) - ưu tiên hơn số liệu đầu mối
 *   chung:    { benNgoaiPhatHien: 'Có'|'Không' },
 *   cfg:      { THANG_PAR: 100, THANG_DTI: 1000 },
 *   overrides:{ [maTieuChi]: { diem: number, lyDo: string } }
 * }
 * Trả về { rows: [...], tong: {...} }.
 *
 * Nguyên tắc (Điều 8, 9 và Lưu ý Phụ lục II QĐ 47/2026/QĐ-TTg):
 *  - Điểm định lượng = A/B × điểm tối đa; vượt tối đa thì lấy tối đa; làm tròn 2 chữ số thập phân.
 *  - "Không phát sinh" chỉ cho điểm tối đa ở C.1, C.2, D.4.2 (Lưu ý 3) và B.1.10.1.
 *  - Các trường hợp mẫu số bằng 0 khác: không tự quy đổi thành điểm tối đa; tính 0 và gắn cảnh báo để giải trình/điều chỉnh.
 *  - Tổng = A + B + C + D + Đ − E, vượt 100 thì lấy 100.
 */

var PACA_GROUPS = ['A', 'B', 'C', 'D'];

function pacaRound2(x) {
  return Math.round((Number(x) + Number.EPSILON) * 100) / 100;
}

function pacaIsBlank(v) {
  return v === null || v === undefined || String(v).trim() === '';
}

function pacaYes(v) {
  return /^(có|co|x|true|1|yes|đạt)$/i.test(String(v == null ? '' : v).trim());
}

/** Ô Có/Không do sở, xã nhập dưới dạng văn bản: "Có", hoặc có ghi văn bản (không phải "Không") và đã tải tệp. */
function pacaCoVanBan(v, soFile) {
  if (pacaYes(v)) return true;
  return !pacaIsBlank(v) && !pacaNo(v) && (soFile == null || soFile > 0);
}

function pacaNo(v) {
  return /^(không|khong|false|0|no)$/i.test(String(v == null ? '' : v).trim());
}

/** Đọc số kiểu Việt Nam: "1.234.567", "1 234 567", "12,5", "12.5". */
function pacaNum(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  var s = String(v == null ? '' : v).trim().replace(/\s/g, '').replace(/đ|đồng|vnd/gi, '');
  if (!s) return 0;
  if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  else if (/^-?\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '');
  else s = s.replace(',', '.');
  var n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function pacaParentCode(ma) {
  var i = ma.lastIndexOf('.');
  return i < 0 ? '' : ma.slice(0, i);
}

/** Đơn vị có thuộc phạm vi nhập số liệu của tiêu chí không. */
/** Tiêu chí kiểu "dv": đơn vị đã thực hiện khi có văn bản minh chứng và (nếu biết) có tệp tải lên. soFile: undefined = chưa biết. */
function pacaDvTrangThai(values, soFile) {
  var v = values || {};
  if (pacaYes(v.khongThuocDien)) return 'KTD';
  if (soFile > 0) return 'DA'; // đã tải tệp minh chứng là đã thực hiện (Thanh tra Chính phủ thẩm định)
  return pacaIsBlank(v.vanBan) ? 'CHUA' : 'THIEU_TEP';
}

/** Cơ quan chuyên môn thuộc UBND tỉnh (đều có chức năng tiếp công dân - B.1.10.3): Văn phòng UBND tỉnh, các sở, Thanh tra tỉnh. */
var PACA_CQCM = ['SO01', 'SO02', 'SO03', 'SO04', 'SO05', 'SO06', 'SO07', 'SO08', 'SO09', 'SO10', 'SO11', 'SO12', 'SO13', 'SO14'];

/**
 * Ô cấp tỉnh đánh dấu vb:true (A.1 "UBND tỉnh có văn bản...", Đ.2) được xác định tự động:
 * có văn bản minh chứng VÀ có tệp tải lên thì là "Có". Trả về bản sao tinh đã bổ sung.
 * rows: { ma: { vanBan } }, files: { ma: [..] }
 */
function pacaTinhTuVanBan(criteria, tinh, rows, files) {
  var out = {};
  Object.keys(tinh || {}).forEach(function (ma) { out[ma] = Object.assign({}, tinh[ma]); });
  criteria.forEach(function (c) {
    (c.tinh || []).forEach(function (f) {
      if (!f.vb) return;
      var r = (rows || {})[c.ma] || {}, n = (((files || {})[c.ma]) || []).length;
      var o = out[c.ma] = out[c.ma] || {};
      o[f.k] = !pacaIsBlank(r.vanBan) && n > 0 ? 'Có' : '';
    });
  });
  return out;
}

function pacaUnitApplies(c, unit) {
  if (!c.donVi || unit.hoatDong === false) return false;
  var ap = c.donVi.apDung;
  if (ap === 'CA_HAI') return unit.loai === 'SO' || unit.loai === 'XA';
  if (ap === 'CQCM') return unit.loai === 'SO' && PACA_CQCM.indexOf(unit.ma) >= 0;
  return unit.loai === ap;
}

function pacaScore(input) {
  var criteria = input.criteria;
  var units = input.units || [];
  var unitData = input.unitData || {};
  var tinh = input.tinh || {};
  var chung = input.chung || {};
  var cfg = Object.assign({ THANG_PAR: 100, THANG_DTI: 1000 }, input.cfg || {});
  var overrides = input.overrides || {};
  var ngoai = pacaYes(chung.benNgoaiPhatHien);
  var unitByMa = {};
  units.forEach(function (u) { unitByMa[u.ma] = u; });

  function entry(uMa, cMa) {
    return (unitData[uMa] && unitData[uMa][cMa]) || null;
  }
  function rejected(e) {
    return e && (e.review === 'KHONG_DAT' || e.review === 'KHONG_THUOC_DIEN');
  }
  function fieldDef(c, k) {
    var all = [].concat(c.tinh || [], (c.donVi && c.donVi.fields) || []);
    for (var i = 0; i < all.length; i++) if (all[i].k === k) return all[i];
    return { k: k, type: 'number' };
  }
  function applicable(c) {
    return units.filter(function (u) { return pacaUnitApplies(c, u); });
  }

  /** Giá trị cấp tỉnh: NHAP_TINH (nếu có) > tổng hợp từ đơn vị đầu mối. */
  function tinhVal(c, k, warns) {
    var t = tinh[c.ma] || {};
    if (!pacaIsBlank(t[k])) return { v: t[k], nguon: 'Tổ công tác đánh giá xác định' };
    var def = fieldDef(c, k);
    var vals = [];
    (c.dauMoi || []).forEach(function (uMa) {
      var e = entry(uMa, c.ma);
      if (!e || rejected(e) || pacaIsBlank(e.values[k])) return;
      vals.push({ v: e.values[k], u: uMa, f: e.soFile });
    });
    if (!vals.length) return { v: '', nguon: '' };
    var nguon = 'Đầu mối: ' + vals.map(function (x) { return (unitByMa[x.u] || {}).ten || x.u; }).join(', ');
    if (vals.some(function (x) { return !(entry(x.u, c.ma).review === 'DAT'); })) {
      warns.push('Số liệu đầu mối chưa được rà soát (' + k + ').');
    }
    if (def.type === 'yesno') {
      return { v: vals.some(function (x) { return pacaCoVanBan(x.v, x.f); }) ? 'Có' : 'Không', nguon: nguon };
    }
    if (def.type === 'select') {
      return { v: Math.max.apply(null, vals.map(function (x) { return pacaNum(x.v); })), nguon: nguon };
    }
    if (def.type === 'text') return { v: vals.map(function (x) { return x.v; }).join('; '), nguon: nguon };
    return { v: vals.reduce(function (s, x) { return s + pacaNum(x.v); }, 0), nguon: nguon };
  }

  /** Cộng dồn trường số của các đơn vị + phần bổ sung cấp tỉnh. */
  function sumUnits(c, keys, warns, info) {
    var tot = {};
    keys.forEach(function (k) { tot[k] = 0; });
    var reported = 0, excluded = [];
    applicable(c).forEach(function (u) {
      var e = entry(u.ma, c.ma);
      if (!e) return;
      if (rejected(e)) { excluded.push(u.ten); return; }
      var any = false;
      keys.forEach(function (k) {
        if (!pacaIsBlank(e.values[k])) { tot[k] += pacaNum(e.values[k]); any = true; }
      });
      if (any) reported++;
    });
    var t = tinh[c.ma] || {};
    var bs = false;
    keys.forEach(function (k) {
      if (!pacaIsBlank(t[k])) { tot[k] += pacaNum(t[k]); bs = true; }
    });
    if (excluded.length) warns.push('Loại số liệu không được rà soát của: ' + excluded.join(', ') + '.');
    if (info) info.push(reported + '/' + applicable(c).length + ' đơn vị có số liệu' + (bs ? '; có số liệu bổ sung cấp tỉnh' : '') + '.');
    return tot;
  }

  function ratio(num, den, max, zeroMode, warns, label) {
    if (den > 0) {
      if (num > den) { warns.push((label || 'Tử số') + ' lớn hơn mẫu số; đã giới hạn bằng mẫu số.'); num = den; }
      return num / den * max;
    }
    if (zeroMode === 'max') return max;
    warns.push('Mẫu số bằng 0: Phụ lục II không quy định cách tính, tạm tính 0 điểm - cần giải trình hoặc xin hướng dẫn.');
    return 0;
  }

  var R = {
    dv: function (c, out) {
      var num = 0, den = 0, chuaBC = [];
      applicable(c).forEach(function (u) {
        var e = entry(u.ma, c.ma);
        var rv = e ? e.review : '';
        var tt = e ? pacaDvTrangThai(e.values, e.soFile) : 'CHUA';
        if (rv === 'KHONG_THUOC_DIEN' || tt === 'KTD') { out.dsKhongThuocDien.push(u.ten); return; }
        den++;
        if (rv !== 'KHONG_DAT' && (rv === 'DAT' || tt === 'DA')) { num++; out.dsDat.push(u.ten); out.dvDat.push({ ma: u.ma, ten: u.ten }); return; }
        if (!e) chuaBC.push(u.ten);
        out.dsChuaDat.push(u.ten + (tt === 'THIEU_TEP' ? ' (có văn bản, chưa tải tệp)' : ''));
      });
      out.tuSo = num; out.mauSo = den; out.demDonVi = true;
      if (chuaBC.length) out.canhBao.push(chuaBC.length + ' đơn vị chưa báo cáo (tính vào mẫu số).');
      return ratio(num, den, c.max, 'warn0', out.canhBao);
    },
    ratioSum: function (c, out) {
      var tot = sumUnits(c, [c.num, c.den], out.canhBao, out.chiTiet);
      out.tuSo = tot[c.num]; out.mauSo = tot[c.den];
      return ratio(tot[c.num], tot[c.den], c.max, c.zero, out.canhBao);
    },
    ratioTinh: function (c, out) {
      var a = tinhVal(c, c.num, out.canhBao), b = tinhVal(c, c.den, out.canhBao);
      if (pacaIsBlank(a.v) && pacaIsBlank(b.v)) { out.canhBao.push('Chưa có số liệu.'); out.thieuSoLieu = true; }
      if (a.nguon) out.chiTiet.push(a.nguon);
      out.tuSo = pacaNum(a.v); out.mauSo = pacaNum(b.v);
      return ratio(out.tuSo, out.mauSo, c.max, c.zero, out.canhBao);
    },
    parts: function (c, out) {
      var s = 0, missing = false;
      (c.tinh || []).forEach(function (f) {
        var r = tinhVal(c, f.k, out.canhBao);
        var yes = pacaYes(r.v);
        if (!yes && c.donVi) {
          var who = applicable(c).filter(function (u) {
            var e = entry(u.ma, c.ma);
            return e && !rejected(e) && pacaCoVanBan(e.values[f.k], e.soFile);
          });
          if (who.length) {
            yes = true;
            out.dsDat = who.map(function (u) { return u.ten; });
            out.chiTiet.push('Đơn vị báo cáo có: ' + out.dsDat.join(', ') + '.');
          }
        }
        if (pacaIsBlank(r.v) && !yes) missing = true;
        if (r.nguon) out.chiTiet.push(r.nguon);
        if (yes) s += f.w;
      });
      if (missing) { out.canhBao.push('Chưa có số liệu.'); out.thieuSoLieu = true; }
      return s;
    },
    level: function (c, out) {
      var r = tinhVal(c, c.tinh[0].k, out.canhBao);
      if (pacaIsBlank(r.v)) { out.canhBao.push('Chưa chọn mức.'); out.thieuSoLieu = true; return 0; }
      if (r.nguon) out.chiTiet.push(r.nguon);
      return pacaNum(r.v);
    },
    scale: function (c, out) {
      var r = tinhVal(c, c.scaleKey, out.canhBao);
      if (pacaIsBlank(r.v)) { out.canhBao.push('Chưa có số liệu.'); out.thieuSoLieu = true; return 0; }
      if (r.nguon) out.chiTiet.push(r.nguon);
      var thang = c.scaleFixed || pacaNum(cfg[c.scaleCfg]);
      out.tuSo = pacaNum(r.v); out.mauSo = thang;
      return thang > 0 ? out.tuSo / thang * c.max : 0;
    },
    xdli: function (c, out) {
      var chua = 0, ds = [];
      applicable(c).forEach(function (u) {
        var e = entry(u.ma, c.ma);
        if (!e || rejected(e)) return;
        var n = Math.max(0, pacaNum(e.values.vuPhatHien) - pacaNum(e.values.vuDaXuLy));
        if (n > 0) { chua += n; ds.push(u.ten + ' (' + n + ')'); }
      });
      out.tuSo = chua;
      out.chiTiet.push('Số vụ XĐLI còn chưa xử lý: ' + chua + (ds.length ? ' - ' + ds.join(', ') : '') + '.');
      out.dsChuaDat = ds;
      return Math.max(0, 1 - 0.2 * chua) * c.max;
    },
    b153: function (c, out) {
      var chuaRaSoat = [], thieu = [];
      applicable(c).forEach(function (u) {
        var e = entry(u.ma, c.ma);
        if (e && e.review === 'KHONG_THUOC_DIEN') return;
        if (!e || !pacaCoVanBan(e.values.daRaSoat, e.soFile) || e.review === 'KHONG_DAT') { chuaRaSoat.push(u.ten); return; }
        if (pacaNum(e.values.nguoiDa) < pacaNum(e.values.nguoiPhai)) thieu.push(u.ten);
      });
      out.dsChuaDat = chuaRaSoat.concat(thieu);
      if (chuaRaSoat.length) {
        out.canhBao.push(chuaRaSoat.length + ' đơn vị chưa rà soát hoặc chưa báo cáo: ' + chuaRaSoat.slice(0, 10).join(', ') + (chuaRaSoat.length > 10 ? '...' : ''));
        return 0;
      }
      if (thieu.length) { out.chiTiet.push('Chuyển đổi chưa đầy đủ: ' + thieu.join(', ')); return 0.5; }
      return 1;
    },
    tcd: function (c, out) {
      var num = 0, den = 0;
      applicable(c).forEach(function (u) {
        var e = entry(u.ma, c.ma);
        if (e && e.review === 'KHONG_THUOC_DIEN') { out.dsKhongThuocDien.push(u.ten); return; }
        den++;
        if (e && e.review !== 'KHONG_DAT' && (e.review === 'DAT' || e.soFile > 0)) { num++; out.dsDat.push(u.ten); out.dvDat.push({ ma: u.ma, ten: u.ten }); }
        else out.dsChuaDat.push(u.ten);
      });
      out.tuSo = num; out.mauSo = den; out.demDonVi = true;
      return ratio(num, den, c.max, 'warn0', out.canhBao);
    },
    c1: function (c, out) {
      var comps = [['kt', 2, 'kiểm tra'], ['gs', 1, 'giám sát'], ['tt', 5, 'thanh tra']];
      var keys = [];
      comps.forEach(function (x) { keys.push(x[0] + 'Tong', x[0] + 'PhatHien'); });
      var tot = sumUnits(c, keys, out.canhBao, out.chiTiet);
      if (ngoai) { out.canhBao.push('Lưu ý 3: có vụ việc do cơ quan ngoài địa phương phát hiện -> không có điểm.'); return 0; }
      var ph = tot.ktPhatHien + tot.gsPhatHien + tot.ttPhatHien;
      if (ph === 0) {
        out.canhBao.push('Lưu ý 3: không phát hiện TNLPTC qua giám sát, thanh tra, kiểm tra -> tính điểm tối đa; phải có báo cáo giải trình.');
        return c.max;
      }
      var s = 0;
      comps.forEach(function (x) {
        var n = tot[x[0] + 'PhatHien'], d = tot[x[0] + 'Tong'];
        out.chiTiet.push(x[2] + ': ' + n + '/' + d);
        s += ratio(n, d, x[1], 'warn0', out.canhBao, 'Số cuộc ' + x[2] + ' phát hiện');
      });
      return s;
    },
    c2: function (c, out) {
      var comps = [['tin', 'tin phản ánh'], ['don', 'đơn tố cáo'], ['bc', 'báo cáo']];
      var keys = [];
      comps.forEach(function (x) { keys.push(x[0] + 'Tong', x[0] + 'PhatHien'); });
      var tot = sumUnits(c, keys, out.canhBao, out.chiTiet);
      if (ngoai) { out.canhBao.push('Lưu ý 3: có vụ việc do cơ quan ngoài địa phương phát hiện -> không có điểm.'); return 0; }
      if (tot.tinTong + tot.donTong + tot.bcTong === 0) {
        out.canhBao.push('Lưu ý 3: không có phản ánh, tố cáo, báo cáo về TNLPTC -> tính điểm tối đa; phải có báo cáo giải trình.');
        return c.max;
      }
      var s = 0;
      comps.forEach(function (x) {
        var n = tot[x[0] + 'PhatHien'], d = tot[x[0] + 'Tong'];
        out.chiTiet.push(x[1] + ': ' + n + '/' + d);
        if (d === 0) {
          out.canhBao.push('Không có ' + x[1] + ' trong kỳ: tính đủ 1 điểm thành phần theo tinh thần Lưu ý 3 - cần giải trình.');
          s += 1;
        } else s += ratio(n, d, 1, 'warn0', out.canhBao);
      });
      return s;
    },
    d42: function (c, out) {
      var tot = sumUnits(c, ['phai', 'da'], out.canhBao, out.chiTiet);
      out.tuSo = tot.da; out.mauSo = tot.phai;
      if (ngoai) { out.canhBao.push('Lưu ý 3: có vụ việc do cơ quan ngoài địa phương phát hiện -> không có điểm.'); return 0; }
      if (tot.phai === 0) {
        out.canhBao.push('Lưu ý 3: không phát sinh tiền, tài sản phải thu hồi -> tính điểm tối đa; phải có báo cáo giải trình.');
        return c.max;
      }
      return ratio(tot.da, tot.phai, c.max, 'warn0', out.canhBao);
    },
    d41: function (c, out) {
      var d42 = byMa['D.4.2'], d43 = byMa['D.4.3'];
      var w = [];
      var a = sumUnits(d42, ['phai', 'da'], w);
      var p = pacaNum(tinhVal(d43, 'phai', w).v), d = pacaNum(tinhVal(d43, 'da', w).v);
      var t = tinh[c.ma] || {};
      var phai = a.phai + p + pacaNum(t.phai), da = a.da + d + pacaNum(t.da);
      out.tuSo = da; out.mauSo = phai;
      out.chiTiet.push('Hành chính ' + a.da + '/' + a.phai + '; tư pháp ' + d + '/' + p + '; bổ sung ' + pacaNum(t.da) + '/' + pacaNum(t.phai) + '.');
      return ratio(da, phai, c.max, 'warn0', out.canhBao);
    }
  };

  var byMa = {};
  criteria.forEach(function (c) { byMa[c.ma] = c; });

  var rows = criteria.map(function (c) {
    return {
      ma: c.ma, ten: c.ten, cap: c.cap, max: c.max, rule: c.rule || '',
      diem: 0, diemTinh: 0, tuSo: '', mauSo: '',
      chiTiet: [], canhBao: c.canhBao ? ['Lưu ý: ' + c.canhBao] : [],
      dsDat: [], dsChuaDat: [], dsKhongThuocDien: [], thieuSoLieu: false, dieuChinh: null,
      demDonVi: false, dvDat: [] /* tiêu chí đếm số đơn vị: các đơn vị được tính vào tử số {ma, ten} */
    };
  });
  var rowBy = {};
  rows.forEach(function (r) { rowBy[r.ma] = r; });

  // 1. Tiêu chí lá
  criteria.forEach(function (c) {
    if (!c.rule) return;
    var out = rowBy[c.ma];
    var raw = R[c.rule](c, out);
    var v = pacaRound2(Math.min(Math.max(raw, 0), c.max));
    out.diemTinh = v;
    out.diem = v;
    var ov = overrides[c.ma];
    if (ov && !pacaIsBlank(ov.diem)) {
      out.diem = pacaRound2(Math.min(Math.max(pacaNum(ov.diem), 0), c.max));
      out.dieuChinh = { diem: out.diem, lyDo: ov.lyDo || '' };
      out.chiTiet.push('Điểm điều chỉnh: ' + out.diem + (ov.lyDo ? ' (' + ov.lyDo + ')' : ''));
    }
  });

  // 2. Dòng tổng hợp (từ dưới lên)
  var parents = criteria.filter(function (c) { return !c.rule; })
    .sort(function (a, b) { return b.ma.split('.').length - a.ma.split('.').length; });
  parents.forEach(function (p) {
    var s = 0;
    criteria.forEach(function (c) { if (pacaParentCode(c.ma) === p.ma) s += rowBy[c.ma].diem; });
    s = pacaRound2(Math.min(s, p.max));
    rowBy[p.ma].diem = s;
    rowBy[p.ma].diemTinh = s;
  });

  var tong = {};
  PACA_GROUPS.forEach(function (g) { tong[g] = rowBy[g] ? rowBy[g].diem : 0; });
  tong.cong = pacaRound2(tong.A + tong.B + tong.C + tong.D);
  tong.diemCong = rowBy['Đ'] ? rowBy['Đ'].diem : 0;
  tong.diemTru = rowBy['E'] ? rowBy['E'].diem : 0;
  tong.truocGioiHan = pacaRound2(tong.cong + tong.diemCong - tong.diemTru);
  tong.tong = Math.min(100, tong.truocGioiHan);
  tong.soCanhBao = rows.filter(function (r) { return r.rule && r.canhBao.length; }).length;
  tong.soThieuSoLieu = rows.filter(function (r) { return r.thieuSoLieu; }).length;
  return { rows: rows, tong: tong };
}

if (typeof module !== 'undefined') {
  module.exports = { pacaCoVanBan: pacaCoVanBan, pacaScore: pacaScore, pacaNum: pacaNum, pacaRound2: pacaRound2, pacaYes: pacaYes, pacaUnitApplies: pacaUnitApplies, pacaParentCode: pacaParentCode, pacaDvTrangThai: pacaDvTrangThai, pacaTinhTuVanBan: pacaTinhTuVanBan, PACA_CQCM: PACA_CQCM };
}
