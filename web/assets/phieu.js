/* PACA 2026 - Xuất biểu số liệu của một đơn vị ra Word (.docx) hoặc in / lưu PDF.
 * Dùng chung cho trang nhập liệu và trang rà soát. Toàn bộ xử lý trên trình duyệt, không gửi dữ liệu đi đâu.
 * window.PACA_PHIEU.word(hs) | .pdf(hs) với hs = dữ liệu "hoSo" (donVi, tieuChi, vuViec, vuViecFields, nhom...).
 * Nội dung lấy một lần (model), dựng ra .docx (tự đóng gói, không dùng thư viện ngoài) hoặc HTML để in.
 * window.PACA_PHIEU.phuLuc02(d): Phụ lục 02 toàn tỉnh (.docx) - mỗi ô giữ được nhiều đường dẫn (Excel chỉ giữ 1).
 */
(function () {
  'use strict';
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '';
    var n = Number(String(v).replace(/\./g, '').replace(',', '.')); // chuỗi kiểu Việt Nam: "1.234.567", "12,5"
    if (v === '' || v == null || !isFinite(n)) return String(v == null ? '' : v);
    return n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  }
  function show(f, v) {
    if (v === '' || v == null) return '';
    if (f.type === 'yesno') return v === 'Có' ? (f.yesLabel || 'Có') : v === 'Không' ? (f.noLabel || 'Không') : v;
    if (f.type === 'select') {
      var o = (f.options || []).filter(function (x) { return String(x.v) === String(v); })[0];
      return o ? o.t : v;
    }
    if (f.type === 'number' || f.type === 'money') return num(v);
    return v;
  }

  // ---------------- Nội dung biểu ----------------
  // Ô = mảng dòng; dòng = mảng đoạn { t, b, i, url }.
  function dongVanBan(s, dau) {
    return String(s).split('\n').map(function (x, i) { return [{ t: (i === 0 && dau ? dau : '') + x }]; });
  }

  function model(hs) {
    var dv = hs.donVi || {};
    var rows = [], lastTop = '', stt = 0;
    (hs.tieuChi || []).forEach(function (tc) {
      var top = tc.ma.split('.')[0];
      if (top !== lastTop) { rows.push({ g: top + '. ' + ((hs.nhom || {})[top] || '') }); lastTop = top; }
      stt++;
      var v = tc.values || {}, soLieu = [];
      tc.fields.forEach(function (f) {
        if (f.k === 'vanBan' || f.k === 'ghiChu' || f.k === 'link') return;
        var s = show(f, v[f.k]);
        if (s === '') return;
        // Ô văn bản (số, ký hiệu, ngày, trích yếu...): chỉ ghi nội dung đơn vị nhập; ô số liệu, lựa chọn: kèm tên ô
        if (f.type === 'text') soLieu = soLieu.concat(dongVanBan(s, '- '));
        else soLieu.push([{ t: '- ' + f.t + ': ' }, { t: String(s), b: true }]);
      });
      if (v.vanBan) soLieu = soLieu.concat(dongVanBan(v.vanBan));
      if (v.link) soLieu.push([{ t: 'Đường dẫn: ' + v.link }]);
      // Văn bản, tài liệu minh chứng: tên tệp, bấm vào tên mở tệp trên Google Drive
      var tep = (tc.files || []).map(function (f) {
        return [{ t: f.ten, url: f.url && f.url !== '#' ? f.url : '' }];
      });
      var ten = [[{ t: tc.ten }]];
      if (tc.vaiTro === 'DAU_MOI') ten.push([{ t: '(đơn vị đầu mối)', i: true }]);
      if (!soLieu.length && !tep.length && !v.ghiChu) soLieu = [[{ t: 'Chưa nhập', i: true }]];
      rows.push({ stt: stt, ma: tc.ma, ten: ten, soLieu: soLieu, tep: tep, ghiChu: v.ghiChu ? dongVanBan(v.ghiChu) : [] });
    });
    var vv = null;
    if (hs.coSoVuViec) {
      var F = hs.vuViecFields || [];
      vv = { F: F, list: (hs.vuViec || []).map(function (r) { return F.map(function (f) { return String(show(f, r[f.k])); }); }) };
    }
    return {
      dv: dv, nam: hs.nam || '', ky: hs.kySoLieu || '', luc: new Date().toLocaleString('vi-VN'),
      tenDv: String(dv.ten || '').replace(/\s*\(.*\)\s*$/, '').toUpperCase(),
      rows: rows, vv: vv, title: 'PACA_' + (hs.nam || '') + '_' + (dv.ma || '')
    };
  }

  var COT = [['STT', 5], ['Mã', 7], ['Tiêu chí', 21], ['Số liệu, nội dung đơn vị khai', 30], ['Văn bản, tài liệu minh chứng', 23], ['Ghi chú', 14]];
  var TIEU_DE = 'BIỂU SỐ LIỆU, TÀI LIỆU MINH CHỨNG';
  var TIEU_DE2 = 'PHỤC VỤ ĐÁNH GIÁ CÔNG TÁC PHÒNG, CHỐNG THAM NHŨNG, LÃNG PHÍ, TIÊU CỰC NĂM ';
  var VV_TIEU_DE = 'SỔ VỤ VIỆC THAM NHŨNG, LÃNG PHÍ, TIÊU CỰC PHÁT HIỆN TRONG KỲ';
  function dongNguoiLap(m) {
    var dv = m.dv;
    return 'Người lập biểu: ' + (dv.nguoiNhap || '') + (dv.dienThoai ? ' - Điện thoại: ' + dv.dienThoai : '') + (dv.email ? ' - Thư điện tử: ' + dv.email : '');
  }
  function dongTrangThai(m) {
    return 'Trạng thái trên hệ thống: ' + (m.dv.trangThai || '') + (m.dv.nopLuc ? ' (nộp lúc ' + m.dv.nopLuc + ')' : '') + '; xuất biểu lúc ' + m.luc + '.';
  }

  // ---------------- In / lưu PDF (HTML) ----------------
  function oHtml(lines) {
    return (lines || []).map(function (l) {
      return l.map(function (r) {
        var s = esc(r.t).replace(/\n/g, '<br>');
        if (r.b) s = '<b>' + s + '</b>';
        if (r.i) s = '<i>' + s + '</i>';
        return r.url ? '<a href="' + esc(r.url) + '">' + s + '</a>' : s;
      }).join('');
    }).join('<br>');
  }

  function html(m) {
    var rows = m.rows.map(function (r) {
      if (r.g) return '<tr><td colspan="6" class="g">' + esc(r.g) + '</td></tr>';
      return '<tr><td class="c">' + r.stt + '</td><td class="c">' + esc(r.ma) + '</td><td>' + oHtml(r.ten) + '</td><td>' + oHtml(r.soLieu) +
        '</td><td>' + oHtml(r.tep) + '</td><td>' + oHtml(r.ghiChu) + '</td></tr>';
    }).join('');
    var vv = '';
    if (m.vv) {
      vv = '<p class="h2">' + VV_TIEU_DE + '</p>' + (!m.vv.list.length ? '<p>Đơn vị không kê khai vụ việc nào trong kỳ.</p>' :
        '<table class="t"><tr><th>STT</th>' + m.vv.F.map(function (f) { return '<th>' + esc(f.t) + '</th>'; }).join('') + '</tr>' +
        m.vv.list.map(function (r, i) {
          return '<tr><td class="c">' + (i + 1) + '</td>' + r.map(function (s, j) {
            var t = m.vv.F[j].type;
            return '<td' + (t === 'number' || t === 'money' ? ' class="r"' : '') + '>' + esc(s) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</table>');
    }
    var css = '@page{size:A4 landscape;margin:2cm 1.5cm 2cm 2.5cm}' +
      'body{font-family:"Times New Roman",serif;font-size:14pt;color:#000}' +
      'table.t{border-collapse:collapse;width:100%}table.t td,table.t th{border:1px solid #000;padding:3pt 5pt;vertical-align:top;font-size:13pt}' +
      'table.t th{font-weight:bold;text-align:center;background:#eeeeee}td.c{text-align:center}td.r{text-align:right}' +
      'td.g{font-weight:bold;background:#f2f2f2}table.h td{border:0;vertical-align:top;text-align:center;font-size:13pt}' +
      'p.t1{text-align:center;font-weight:bold;font-size:14pt;margin:14pt 0 2pt}p.t2{text-align:center;font-style:italic;margin:0 0 10pt}' +
      'p.h2{font-weight:bold;margin:14pt 0 6pt}p{margin:3pt 0}' +
      '@media screen{body{max-width:1100px;margin:20px auto;padding:0 20px}}.noprint{font-family:Arial;font-size:13px;background:#eff6ff;border:1px solid #bfdbfe;padding:8px 12px;margin-bottom:12px}@media print{.noprint{display:none}}';
    return '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>' + esc(m.title) + '</title><style>' + css + '</style></head><body>' +
      '<div class="noprint">Hộp thoại in sẽ mở tự động. Chọn máy in <b>"Lưu dưới dạng PDF" (Save as PDF)</b>, khổ A4 ngang.</div>' +
      '<table class="h" width="100%"><tr><td width="40%"><b>' + esc(m.tenDv) + '</b><br>———————</td>' +
      '<td width="60%"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập - Tự do - Hạnh phúc</b><br>———————————</td></tr></table>' +
      '<p class="t1">' + TIEU_DE + '<br>' + TIEU_DE2 + esc(m.nam) + '</p>' +
      '<p class="t2">(Theo Quyết định số 47/2026/QĐ-TTg; kỳ số liệu: ' + esc(m.ky) + ')</p>' +
      '<p>' + esc(dongNguoiLap(m)) + '</p><p>' + esc(dongTrangThai(m)) + '</p>' +
      '<table class="t" style="margin-top:8pt"><tr>' + COT.map(function (c) { return '<th width="' + c[1] + '%">' + c[0] + '</th>'; }).join('') + '</tr>' + rows + '</table>' + vv +
      '<table class="h" width="100%" style="margin-top:18pt"><tr><td width="50%"><b>NGƯỜI LẬP BIỂU</b><br><i>(Ký, ghi rõ họ tên)</i><br><br><br><br>' +
      esc(m.dv.nguoiNhap || '') + '</td><td width="50%"><i>........, ngày ..... tháng ..... năm ' + esc(m.nam) + '</i><br><b>THỦ TRƯỞNG ĐƠN VỊ</b><br><i>(Ký tên, đóng dấu)</i></td></tr></table>' +
      '</body></html>';
  }

  // ---------------- Word (.docx) ----------------
  var RONG = 14570; // bề rộng vùng in A4 ngang, lề trái 2,5 cm, phải 1,5 cm (twip)
  function x(s) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function w(pct) { return Math.round(RONG * pct / 100); }

  /** Bộ dựng .docx: đoạn (dòng = mảng đoạn chữ {t, b, i, url}), ô, dòng, bảng; pack(body) -> Uint8Array. */
  function taoDocx() {
    var links = [];
    function run(r, sz) {
      var pr = (r.url ? '<w:rStyle w:val="Hyperlink"/>' : '') + (r.b ? '<w:b/>' : '') + (r.i ? '<w:i/>' : '') + (sz ? '<w:sz w:val="' + sz + '"/><w:szCs w:val="' + sz + '"/>' : '');
      var t = String(r.t).split('\t').map(function (s) { return '<w:t xml:space="preserve">' + x(s) + '</w:t>'; }).join('<w:tab/>');
      var out = '<w:r>' + (pr ? '<w:rPr>' + pr + '</w:rPr>' : '') + t + '</w:r>';
      if (r.url) { links.push(r.url); out = '<w:hyperlink r:id="rIdL' + links.length + '" w:history="1">' + out + '</w:hyperlink>'; }
      return out;
    }
    function p(line, o) {
      o = o || {};
      return '<w:p><w:pPr>' + (o.keep ? '<w:keepNext/>' : '') + '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after || 0) + '"/>' +
        (o.jc ? '<w:jc w:val="' + o.jc + '"/>' : '') + '</w:pPr>' + (line || []).map(function (r) { return run(r, o.sz); }).join('') + '</w:p>';
    }
    function tc(lines, width, o) {
      o = o || {};
      var ps = (lines && lines.length ? lines : [[]]).map(function (l) {
        return p(o.b ? l.map(function (r) { return Object.assign({ b: true }, r); }) : l, { jc: o.jc, sz: o.sz });
      }).join('');
      return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/>' + (o.span ? '<w:gridSpan w:val="' + o.span + '"/>' : '') +
        (o.shd ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.shd + '"/>' : '') + '</w:tcPr>' + ps + '</w:tc>';
    }
    function tr(cells, o) {
      o = o || {};
      var pr = (o.cantSplit ? '<w:cantSplit/>' : '') + (o.header ? '<w:tblHeader/>' : '');
      return '<w:tr>' + (pr ? '<w:trPr>' + pr + '</w:trPr>' : '') + cells + '</w:tr>';
    }
    function tbl(widths, rowsXml, vien) {
      var b = vien ? '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (k) {
        return '<w:' + k + ' w:val="single" w:sz="4" w:space="0" w:color="000000"/>';
      }).join('') + '</w:tblBorders>' : '';
      return '<w:tbl><w:tblPr><w:tblW w:w="' + RONG + '" w:type="dxa"/>' + b + '<w:tblLayout w:type="fixed"/>' +
        '<w:tblCellMar><w:left w:w="85" w:type="dxa"/><w:right w:w="85" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' +
        widths.map(function (v) { return '<w:gridCol w:w="' + v + '"/>'; }).join('') + '</w:tblGrid>' + rowsXml + '</w:tbl>';
    }
    function pack(body) {
      var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
      var HDR = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
      var REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
      var doc = HDR + '<w:document ' + NS + '><w:body>' + body +
        '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1418" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>' +
        '</w:body></w:document>';
      var styles = HDR + '<w:styles ' + NS + '><w:docDefaults><w:rPrDefault><w:rPr>' +
        '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/><w:lang w:val="vi-VN"/>' +
        '</w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
        '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
        '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style></w:styles>';
      var rels = HDR + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rIdS" Type="' + REL + 'styles" Target="styles.xml"/>' +
        links.map(function (u, i) { return '<Relationship Id="rIdL' + (i + 1) + '" Type="' + REL + 'hyperlink" Target="' + x(u) + '" TargetMode="External"/>'; }).join('') +
        '</Relationships>';
      return zip([
        ['[Content_Types].xml', HDR + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
          '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'],
        ['_rels/.rels', HDR + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="' + REL + 'officeDocument" Target="word/document.xml"/></Relationships>'],
        ['word/document.xml', doc],
        ['word/styles.xml', styles],
        ['word/_rels/document.xml.rels', rels]
      ]);
    }
    return { run: run, p: p, tc: tc, tr: tr, tbl: tbl, pack: pack };
  }

  /** Biểu số liệu của một đơn vị. */
  function docx(m) {
    var D = taoDocx(), p = D.p, tc = D.tc, tr = D.tr, tbl = D.tbl;
    var T = 26; // cỡ chữ trong bảng: 13
    var W = COT.map(function (c) { return w(c[1]); });
    var body = tbl([w(40), w(60)], tr(
      tc([[{ t: m.tenDv, b: true }], [{ t: '———————' }]], w(40), { jc: 'center', sz: T }) +
      tc([[{ t: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', b: true }], [{ t: 'Độc lập - Tự do - Hạnh phúc', b: true }], [{ t: '———————————' }]], w(60), { jc: 'center', sz: T })), false);
    body += p([{ t: TIEU_DE, b: true }], { jc: 'center', before: 280 }) + p([{ t: TIEU_DE2 + m.nam, b: true }], { jc: 'center' });
    body += p([{ t: '(Theo Quyết định số 47/2026/QĐ-TTg; kỳ số liệu: ' + m.ky + ')', i: true }], { jc: 'center', after: 200 });
    body += p([{ t: dongNguoiLap(m) }], { after: 60 }) + p([{ t: dongTrangThai(m) }], { after: 160 });
    var rx = tr(COT.map(function (c, i) { return tc([[{ t: c[0] }]], W[i], { jc: 'center', b: true, sz: T, shd: 'EEEEEE' }); }).join(''), { header: true });
    m.rows.forEach(function (r) {
      if (r.g) { rx += tr(tc([[{ t: r.g, b: true }]], RONG, { span: 6, sz: T, shd: 'F2F2F2' })); return; }
      rx += tr(tc([[{ t: String(r.stt) }]], W[0], { jc: 'center', sz: T }) + tc([[{ t: r.ma }]], W[1], { jc: 'center', sz: T }) +
        tc(r.ten, W[2], { sz: T }) + tc(r.soLieu, W[3], { sz: T }) + tc(r.tep, W[4], { sz: T }) + tc(r.ghiChu, W[5], { sz: T }));
    });
    body += tbl(W, rx, true);
    if (m.vv) {
      body += p([{ t: VV_TIEU_DE, b: true }], { before: 280, after: 120, keep: true });
      if (!m.vv.list.length) body += p([{ t: 'Đơn vị không kê khai vụ việc nào trong kỳ.' }]);
      else {
        var w0 = w(5), wc = Math.floor((RONG - w0) / m.vv.F.length);
        var vx = tr(tc([[{ t: 'STT' }]], w0, { jc: 'center', b: true, sz: T, shd: 'EEEEEE' }) +
          m.vv.F.map(function (f) { return tc([[{ t: f.t }]], wc, { jc: 'center', b: true, sz: T, shd: 'EEEEEE' }); }).join(''), { header: true });
        m.vv.list.forEach(function (r, i) {
          vx += tr(tc([[{ t: String(i + 1) }]], w0, { jc: 'center', sz: T }) + r.map(function (s, j) {
            var t = m.vv.F[j].type;
            return tc(dongVanBan(s), wc, { sz: T, jc: t === 'number' || t === 'money' ? 'right' : '' });
          }).join(''));
        });
        body += tbl([w0].concat(m.vv.F.map(function () { return wc; })), vx, true);
      }
    }
    body += p([], { after: 240, keep: true });
    body += tbl([w(50), w(50)], tr(
      tc([[{ t: 'NGƯỜI LẬP BIỂU', b: true }], [{ t: '(Ký, ghi rõ họ tên)', i: true }], [], [], [], [{ t: m.dv.nguoiNhap || '' }]], w(50), { jc: 'center', sz: T }) +
      tc([[{ t: '........, ngày ..... tháng ..... năm ' + m.nam, i: true }], [{ t: 'THỦ TRƯỞNG ĐƠN VỊ', b: true }], [{ t: '(Ký tên, đóng dấu)', i: true }]], w(50), { jc: 'center', sz: T }),
      { cantSplit: true }), false);
    return D.pack(body);
  }

  /**
   * Phụ lục 02 (bảng tự chấm điểm toàn tỉnh theo Phụ lục II QĐ 47) - bản Word giữ đủ đường dẫn từng đơn vị trong một ô.
   * d = { pl02: pacaPL02Rows(...), tong: { tong }, luc, nam, ky }
   */
  function phuLuc02Docx(d) {
    var D = taoDocx(), p = D.p, tc = D.tc, tr = D.tr, tbl = D.tbl;
    var T = 24; // cỡ chữ trong bảng: 12
    var C = [['TÊN TIÊU CHÍ ĐÁNH GIÁ', 21], ['CÁCH TÍNH ĐIỂM', 26], ['YÊU CẦU TÀI LIỆU, SỐ LIỆU PHỤC VỤ ĐÁNH GIÁ', 23], ['Điểm tối đa', 6], ['Điểm tự chấm', 6], ['GHI CHÚ (diễn giải, lưu ý)', 18]];
    var W = C.map(function (c) { return w(c[1]); });
    function so(v) { return v === '' || v == null ? '' : num(v); }
    function cau(r) { // "Danh sách các đơn vị thực hiện gồm ...: A, B." - mỗi tên đơn vị gắn đường dẫn
      var c = pacaCauMinhChung(r.minhChung, r.tuMau), out = [], k = 0;
      c.links.forEach(function (l) {
        if (l.start > k) out.push({ t: c.text.slice(k, l.start) });
        out.push({ t: c.text.slice(l.start, l.end), url: l.url !== '#' ? l.url : '' });
        k = l.end;
      });
      if (k < c.text.length) out.push({ t: c.text.slice(k) });
      return out.length ? [out] : [];
    }
    var body = p([{ t: 'UBND TỈNH THANH HÓA', b: true }], { after: 120 });
    body += p([{ t: 'PHỤ LỤC 02', b: true }], { jc: 'center' });
    body += p([{ t: 'BẢNG TỰ CHẤM ĐIỂM CÔNG TÁC PHÒNG, CHỐNG THAM NHŨNG, LÃNG PHÍ, TIÊU CỰC NĂM ' + d.nam + ' CỦA UBND TỈNH THANH HÓA', b: true }], { jc: 'center' });
    body += p([{ t: '(Theo Phụ lục II ban hành kèm theo Quyết định số 47/2026/QĐ-TTg ngày 30/9/2026 của Thủ tướng Chính phủ; kỳ số liệu ' + d.ky + ')', i: true }], { jc: 'center', sz: 26 });
    body += p([{ t: 'Số liệu tổng hợp trên hệ thống PACA 2026 lúc ' + d.luc, i: true }], { jc: 'center', sz: 26, after: 200 });
    var rx = tr(C.map(function (c, i) { return tc([[{ t: c[0] }]], W[i], { jc: 'center', b: true, sz: T, shd: 'EEEEEE' }); }).join(''), { header: true });
    (d.pl02 || []).forEach(function (r) {
      var diem = [[{ t: so(r.diem), b: true }]].concat(r.dieuChinh ? [[{ t: '(điều chỉnh)', i: true }]] : []);
      if (!r.rule) {
        var shd = r.cap === 1 ? 'F2F2F2' : '';
        rx += tr(tc([[{ t: r.ten }]], W[0] + W[1] + W[2], { span: 3, b: true, sz: T, shd: shd }) +
          tc([[{ t: so(r.max) }]], W[3], { jc: 'center', b: true, sz: T, shd: shd }) + tc(diem, W[4], { jc: 'center', sz: T, shd: shd }) + tc([], W[5], { sz: T, shd: shd }));
        return;
      }
      rx += tr(tc(dongVanBan(r.ten), W[0], { sz: T }) + tc(dongVanBan(r.cachTinh || ''), W[1], { sz: T }) + tc(cau(r), W[2], { sz: T }) +
        tc([[{ t: so(r.max) }]], W[3], { jc: 'center', sz: T }) + tc(diem, W[4], { jc: 'center', sz: T }) + tc(dongVanBan(r.ghiChu || ''), W[5], { sz: T }));
    });
    rx += tr(tc([[{ t: 'TỔNG ĐIỂM (A + B + C + D + Đ − E, tối đa 100)' }]], W[0] + W[1] + W[2], { span: 3, b: true, sz: T, shd: 'F2F2F2' }) +
      tc([[{ t: '100' }]], W[3], { jc: 'center', b: true, sz: T, shd: 'F2F2F2' }) + tc([[{ t: so((d.tong || {}).tong) }]], W[4], { jc: 'center', b: true, sz: T, shd: 'F2F2F2' }) +
      tc([], W[5], { sz: T, shd: 'F2F2F2' }), { cantSplit: true });
    body += tbl(W, rx, true);
    return D.pack(body);
  }

  // Đóng gói ZIP (không nén) cho .docx
  var CRC = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], cd = [], off = 0;
    var d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    function hdr(len) { var b = new Uint8Array(len); return { b: b, v: new DataView(b.buffer) }; }
    files.forEach(function (f) {
      var name = enc.encode(f[0]), data = enc.encode(f[1]), crc = crc32(data);
      var h = hdr(30), v = h.v;
      v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, 0, true);
      v.setUint16(10, time, true); v.setUint16(12, date, true); v.setUint32(14, crc, true);
      v.setUint32(18, data.length, true); v.setUint32(22, data.length, true); v.setUint16(26, name.length, true); v.setUint16(28, 0, true);
      parts.push(h.b, name, data);
      var c = hdr(46), u = c.v;
      u.setUint32(0, 0x02014b50, true); u.setUint16(4, 20, true); u.setUint16(6, 20, true); u.setUint16(8, 0x0800, true); u.setUint16(10, 0, true);
      u.setUint16(12, time, true); u.setUint16(14, date, true); u.setUint32(16, crc, true);
      u.setUint32(20, data.length, true); u.setUint32(24, data.length, true); u.setUint16(28, name.length, true);
      u.setUint32(42, off, true);
      cd.push(c.b, name);
      off += 30 + name.length + data.length;
    });
    var cdLen = cd.reduce(function (s, b) { return s + b.length; }, 0);
    var e = hdr(22), ev = e.v;
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdLen, true); ev.setUint32(16, off, true);
    var all = parts.concat(cd, [e.b]), len = all.reduce(function (s, b) { return s + b.length; }, 0), out = new Uint8Array(len), p = 0;
    all.forEach(function (b) { out.set(b, p); p += b.length; });
    return out;
  }

  // ---------------- Lệnh xuất ----------------
  function taiVe(bytes, ten) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    a.download = ten + '.docx';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  function word(hs) { var m = model(hs); taiVe(docx(m), m.title); }

  /** Phụ lục 02 toàn tỉnh (trang rà soát). ten: tên tệp không đuôi. */
  function phuLuc02(d, ten) { taiVe(phuLuc02Docx(d), ten || 'PACA_' + d.nam + '_PHU_LUC_02'); }

  function pdf(hs) {
    var w = window.open('', '_blank');
    if (!w) return false;
    w.document.open();
    w.document.write(html(model(hs)));
    w.document.close();
    setTimeout(function () { w.focus(); w.print(); }, 400);
    return true;
  }

  window.PACA_PHIEU = { word: word, pdf: pdf, phuLuc02: phuLuc02, model: model, docx: docx, phuLuc02Docx: phuLuc02Docx, html: html };
})();
