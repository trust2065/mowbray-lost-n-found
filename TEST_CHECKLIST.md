# Quick Test Checklist / 快速測試檢查清單

## 🚀 Critical Function Tests / 關鍵功能測試

### Upload Flow / 上傳流程
- [ ] **Upload large image** (>5MB) → Should compress automatically / 上傳大圖片（>5MB）→ 應自動壓縮
- [ ] **Upload non-image file** (PDF) → Should reject with message / 上傳非圖片文件（PDF）→ 應拒絕並顯示消息
- [ ] **Add 6 items as guest** → Should warn on 6th item / 以訪客身份添加6物品→ 第6物品應警告
- [ ] **Empty name submission** → Should show warning, allow submit / 空名稱提交→ 應顯示警告，允許提交
- [ ] **Add 4th photo to item** → Should warn, prevent add / 為物品添加第4照片→ 應警告，阻止添加

### Search & Filter / 搜索與過濾
- [ ] **Search by name** → Find matching items / 按名稱搜索→ 找到匹配物品
- [ ] **Search by location** → Find items from that location / 按地點搜索→ 找到該地點物品
- [ ] **Filter by category** → Show only that category / 按類別過濾→ 僅顯示該類別
- [ ] **Empty search results** → Show "no items" message / 空搜索結果→ 顯示"無物品"消息

### UI Interactions / UI交互
- [ ] **Open upload modal** → Modal opens correctly / 開啟上傳模態框→ 模態框正確開啟
- [ ] **Click trash button** → Item removes with confirmation / 點擊垃圾桶按鈕→ 物品確認後移除
- [ ] **Switch admin/guest** → UI updates correctly / 切換管理員/訪客→ UI正確更新
- [ ] **View photos** → Photo viewer opens/navigates / 查看照片→ 照片查看器開啟/導航

### Data Persistence / 數據持久性
- [ ] **Upload item** → Item appears immediately / 上傳物品→ 物品立即出現
- [ ] **Refresh page** → Items still present / 刷新頁面→ 物品仍然存在
- [ ] **Close and reopen** → All items loaded / 關閉並重新開啟→ 所有物品加載

---

## 📱 Responsive Design Tests / 響應式設計測試

### Mobile (375px) / 移動設備 (375px)
- [ ] **Upload modal** fits screen / 上傳模態框適應屏幕
- [ ] **Search box** usable / 搜索框可用
- [ ] **Item cards** display correctly / 物品卡片正確顯示
- [ ] **Touch interactions** work / 觸摸交互有效

### Tablet (768px) / 平板 (768px)
- [ ] **Layout adjusts** properly / 布局正確調整
- [ ] **Multi-column view** works / 多列視圖有效
- [ ] **Navigation** accessible / 導航可訪問

### Desktop (1200px+) / 桌面 (1200px+)
- [ ] **Full layout** utilized / 完整布局利用
- [ ] **Hover states** work / 懸停狀態有效
- [ ] **Keyboard navigation** works / 鍵盤導航有效

---

## ⚡ Performance Checks / 性能檢查

### Load Times / 加載時間
- [ ] **Initial page load** < 3 seconds / 初始頁面加載<3秒
- [ ] **Image upload** shows progress / 圖片上傳顯示進度
- [ ] **Search results** < 500ms / 搜索結果<500ms
- [ ] **Modal open** < 200ms / 模態框開啟<200ms

### Memory Usage / 內存使用
- [ ] **No memory leaks** during navigation / 導航期間無內存洩漏
- [ ] **Images unload** when not visible / 不可見時圖片卸載
- [ ] **Cleanup on unmount** works correctly / 卸載時清理正確工作

---

## 🔍 Error Handling Tests / 錯誤處理測試

### Network Issues / 網絡問題
- [ ] **Offline mode** → Graceful degradation / 離線模式→ 優雅降級
- [ ] **Slow network** → Loading indicators work / 慢速網絡→ 加載指示器有效
- [ ] **Upload failure** → Error message shown / 上傳失敗→ 顯示錯誤消息

### User Input Errors / 用戶輸入錯誤
- [ ] **Invalid file types** → Clear rejection message / 無效文件類型→ 清晰拒絕消息
- [ ] **Oversized files** → Size limit warning / 超大文件→ 大小限制警告
- [ ] **Required fields empty** → Validation warnings / 必填字段為空→ 驗證警告

---

## 🎯 Admin Mode Tests / 管理員模式測試

### Admin Privileges / 管理員權限
- [ ] **Can add 10+ items** → No limit warning / 可添加10+物品→ 無限制警告
- [ ] **Can add 10+ photos** → Higher limits / 可添加10+照片→ 更高限制
- [ ] **AI Fill button** visible and functional / AI填充按鈕可見且功能正常
- [ ] **Delete all items** → Confirmation required / 刪除所有物品→ 需要確認

### Mode Switching / 模式切換
- [ ] **Guest to Admin** → UI updates immediately / 訪客轉管理員→ UI立即更新
- [ ] **Admin to Guest** → Limits apply correctly / 管理員轉訪客→ 限制正確應用
- [ ] **State preserved** during switch / 切換期間狀態保持

---

## 📊 Quality Assurance / 質量保證

### Visual Checks / 視覺檢查
- [ ] **No console errors** / 無控制台錯誤
- [ ] **Consistent styling** / 一致樣式
- [ ] **Proper spacing** and alignment / 適當間距和對齊
- [ ] **Readable text** at all sizes / 所有尺寸可讀文本

### Functionality Checks / 功能檢查
- [ ] **All buttons work** / 所有按鈕有效
- [ ] **Forms validate** properly / 表單正確驗證
- [ ] **Links navigate** correctly / 鏈接正確導航
- [ ] **Modals close** properly / 模態框正確關閉

---

## 🚨 Critical Bugs to Watch For / 需注意的嚴重錯誤

### Showstoppers / 阻止程序
- ❌ **Upload completely fails** / 上傳完全失敗
- ❌ **Data loss on refresh** / 刷新時數據丟失
- ❌ **App crashes** on any action / 任何操作時應用崩潰
- ❌ **Security vulnerabilities** / 安全漏洞

### Major Issues / 主要問題
- ⚠️ **Performance degradation** / 性能下降
- ⚠️ **UI broken on mobile** / 移動設備上UI損壞
- ⚠️ **Search not working** / 搜索無效
- ⚠️ **Validation bypass possible** / 可能繞過驗證

### Minor Issues / 次要問題
- ⚡ **Typos in text** / 文本錯別字
- ⚡ **Alignment issues** / 對齊問題
- ⚡ **Inconsistent styling** / 不一致樣式
- ⚡ **Missing hover states** / 缺少懸停狀態

---

## 📝 Test Results Template / 測試結果模板

```
Date: _____________
Tester: ___________
Browser: __________
Device: ___________

✅ Passed: ___
❌ Failed: ___
⚠️ Issues: ___

Critical Issues:
1. 
2.

Major Issues:
1. 
2.

Minor Issues:
1. 
2.

Performance Notes:
-

Overall Status: [Ready for Release / Needs Fixes / Not Ready]
```

---

## 🔄 Regression Checklist / 回歸檢查清單

### After Each Update / 每次更新後
- [ ] Upload still works / 上傳仍然有效
- [ ] Search still works / 搜索仍然有效
- [ ] No new console errors / 無新控制台錯誤
- [ ] Performance not degraded / 性能未下降

### Before Release / 發布前
- [ ] All critical tests pass / 所有关键测试通过
- [ ] No known security issues / 無已知安全問題
- [ ] Documentation updated / 文檔已更新
- [ ] Backup procedures tested / 備份程序已測試

---

## 🎯 Quick Pass/Fail Criteria / 快速通過/失敗標準

### ✅ PASS - Ready for Release / 通過 - 準備發布
- All upload features work / 所有上傳功能有效
- Search and filter work / 搜索和過濾有效
- No critical bugs / 無嚴重錯誤
- Performance acceptable / 性能可接受

### ⚠️ CONDITIONAL - Needs Minor Fixes / 有條件 - 需要小修復
- Core features work / 核心功能有效
- Minor UI issues / 次要UI問題
- Performance slightly slow / 性能略慢
- Documentation incomplete / 文檔不完整

### ❌ FAIL - Not Ready / 失敗 - 未準備好
- Upload doesn't work / 上傳無效
- Data loss issues / 數據丟失問題
- Security concerns / 安全問題
- Major performance issues / 主要性能問題
