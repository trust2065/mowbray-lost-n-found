# Test Plan / 測試計劃

## Overview / 概述

Comprehensive testing strategy to ensure all implemented features work correctly without errors. This plan covers manual testing procedures, automated testing recommendations, and quality assurance guidelines.

確保所有已實現功能正確無誤運行的綜合測試策略。本計劃涵蓋手動測試程序、自動化測試建議和質量保譕指南。

---

## 🧪 Test Categories / 測試類別

### 1. Upload Functionality Tests / 上傳功能測試

#### 1.1 Image Upload & Compression / 圖片上傳與壓縮
**Test Cases / 測試用例:**
- [ ] **Large image upload** (>5MB) - Verify compression works / 大圖片上傳（>5MB）- 驗證壓縮有效
- [ ] **Multiple image upload** - Test batch processing / 多圖片上傳 - 測試批處理
- [ ] **File size limit** - Upload 25MB file, expect rejection / 文件大小限制 - 上傳25MB文件，預期被拒絕
- [ ] **Format validation** - Try uploading PDF/DOC files / 格式驗證 - 嘗試上傳PDF/DOC文件
- [ ] **Compression quality** - Verify image quality after compression / 壓縮質量 - 驗證壓縮後圖片質量

**Expected Results / 預期結果:**
- Large images compressed to <1MB / 大圖片壓縮至<1MB
- Non-image files rejected with clear message / 非圖片文件被拒絕並顯示清晰消息
- Upload progress indicators work correctly / 上傳進度指示器正常工作

#### 1.2 Item Limits & Validation / 物品限制與驗證
**Test Cases / 測試用例:**
- [ ] **Guest limit** - Try adding 6th item as guest / 訪客限制 - 嘗試以訪客身份添加第6個物品
- [ ] **Admin limit** - Try adding 11th item as admin / 管理員限制 - 嘗試以管理員身份添加第11個物品
- [ ] **Photo limits** - Add 4th photo to guest item / 照片限制 - 為訪客物品添加第4張照片
- [ ] **Name validation** - Submit with empty name / 名稱驗證 - 提交空名稱
- [ ] **Generic names** - Use "Unknown", "Item" as names / 通用名稱 - 使用"未知"、"物品"作為名稱

**Expected Results / 預期結果:**
- Clear warning messages for validation issues / 驗證問題的清晰警告消息
- Submit button remains enabled (non-blocking) / 提交按鈕保持啟用（非阻塞）
- Confirmation dialogs for validation warnings / 驗證警告的確認對話框

### 2. Search & Filter Tests / 搜索與過濾測試

#### 2.1 Search Functionality / 搜索功能
**Test Cases / 測試用例:**
- [ ] **Name search** - Search by item name / 名稱搜索 - 按物品名稱搜索
- [ ] **Description search** - Search by description keywords / 描述搜索 - 按描述關鍵詞搜索
- [ ] **Location search** - Search by location / 地點搜索 - 按地點搜索
- [ ] **Case sensitivity** - Test uppercase/lowercase / 大小寫敏感 - 測試大寫/小寫
- [ ] **Partial matches** - Search with partial words / 部分匹配 - 用部分單詞搜索

**Expected Results / 預期結果:**
- Search works across all three fields / 搜索在所有三個字段中有效
- Results update in real-time / 結果實時更新
- No results state handled gracefully / 無結果狀態優雅處理

#### 2.2 Category Filtering / 類別過濾
**Test Cases / 測試用例:**
- [ ] **All categories** - Show all items / 所有類別 - 顯示所有物品
- [ ] **Specific category** - Filter by one category / 特定類別 - 按一個類別過濾
- [ ] **Empty categories** - Filter by category with no items / 空類別 - 按無物品的類別過濾

### 3. UI/UX Interaction Tests / UI/UX交互測試

#### 3.1 Modal & Dialog Tests / 模態框與對話框測試
**Test Cases / 測試用例:**
- [ ] **Upload modal** - Open/close functionality / 上傳模態框 - 開啟/關閉功能
- [ ] **Add another item** - Button functionality / 添加另一物品 - 按鈕功能
- [ ] **Trash button** - Remove item functionality / 垃圾桶按鈕 - 移除物品功能
- [ ] **Confirmation dialogs** - Cancel/confirm actions / 確認對話框 - 取消/確認操作
- [ ] **Photo viewer** - Open/close, navigation / 照片查看器 - 開啟/關閉、導航

#### 3.2 Responsive Design Tests / 響應式設計測試
**Test Cases / 測試用例:**
- [ ] **Mobile view** - Test on 375px width / 移動視圖 - 在375px寬度測試
- [ ] **Tablet view** - Test on 768px width / 平板視圖 - 在768px寬度測試
- [ ] **Desktop view** - Test on 1200px+ width / 桌面視圖 - 在1200px+寬度測試
- [ ] **Touch interactions** - Test on mobile devices / 觸摸交互 - 在移動設備上測試

### 4. Data Persistence Tests / 數據持久性測試

#### 4.1 Firebase Integration / Firebase集成
**Test Cases / 測試用例:**
- [ ] **Data saving** - Verify items save correctly / 數據保存 - 驗證物品正確保存
- [ ] **Data retrieval** - Verify items load correctly / 數據檢索 - 驗證物品正確加載
- [ ] **Image storage** - Verify images save to storage / 圖片存儲 - 驗證圖片保存到存儲
- [ ] **Page refresh** - Items persist after refresh / 頁面刷新 - 刷新後物品持久存在
- [ ] **Network issues** - Handle offline/reconnect scenarios / 網絡問題 - 處理離線/重連場景

### 5. Performance Tests / 性能測試

#### 5.1 Load Performance / 加載性能
**Test Cases / 測試用例:**
- [ ] **Initial load** - Page loads within 3 seconds / 初始加載 - 頁面在3秒內加載
- [ ] **Image loading** - Images load progressively / 圖片加載 - 圖片漸進式加載
- [ ] **Search performance** - Search results within 500ms / 搜索性能 - 搜索結果在500ms內
- [ ] **Large dataset** - Test with 100+ items / 大數據集 - 用100+物品測試

#### 5.2 Memory Usage / 內存使用
**Test Cases / 測試用例:**
- [ ] **Memory leaks** - Monitor memory during navigation / 內存洩漏 - 導航期間監控內存
- [ ] **Image cleanup** - Verify unused images cleared / 圖片清理 - 驗證未使用圖片被清除
- [ ] **Component unmount** - Proper cleanup on navigation / 組件卸載 - 導航時正確清理

### 6. Error Handling Tests / 錯誤處理測試

#### 6.1 Network Errors / 網絡錯誤
**Test Cases / 測試用例:**
- [ ] **Upload failure** - Handle network timeout / 上傳失敗 - 處理網絡超時
- [ ] **API errors** - Handle Gemini API failures / API錯誤 - 處理Gemini API失敗
- [ ] **Firebase errors** - Handle database errors / Firebase錯誤 - 處理數據庫錯誤
- [ ] **Image errors** - Handle corrupted images / 圖片錯誤 - 處理損壞圖片

#### 6.2 User Input Errors / 用戶輸入錯誤
**Test Cases / 測試用例:**
- [ ] **Invalid files** - Handle non-image uploads / 無效文件 - 處理非圖片上傳
- [ ] **Large files** - Handle oversized uploads / 大文件 - 處理超大上傳
- [ ] **Empty forms** - Handle missing required data / 空表單 - 處理缺少必需數據

---

## 🔧 Testing Tools & Environment / 測試工具與環境

### Required Tools / 必需工具
- **Chrome DevTools** - Performance monitoring / Chrome開發者工具 - 性能監控
- **Network throttling** - Simulate slow connections / 網絡限速 - 模擬慢速連接
- **Mobile emulation** - Test responsive design / 移動模擬 - 測試響應式設計
- **Firebase Console** - Monitor database operations / Firebase控制台 - 監控數據庫操作

### Test Data / 測試數據
- **Sample images**: Various sizes (100KB to 25MB) / 樣本圖片：各種大小（100KB到25MB）
- **Test items**: Different categories and locations / 測試物品：不同類別和地點
- **Edge cases**: Special characters, long names / 邊界情況：特殊字符、長名稱

---

## 📋 Test Execution Checklist / 執行檢查清單

### Pre-Test Setup / 測試前設置
- [ ] Clear browser cache and cookies / 清除瀏覽器緩存和Cookie
- [ ] Verify Firebase connection / 驗證Firebase連接
- [ ] Check proxy server status / 檢查代理服務器狀態
- [ ] Prepare test images and data / 準備測試圖片和數據

### During Testing / 測試期間
- [ ] Document all findings and issues / 記錄所有發現和問題
- [ ] Take screenshots of UI states / 拍攝UI狀態截圖
- [ ] Monitor console for errors / 監控控制台錯誤
- [ ] Test both guest and admin modes / 測試訪客和管理員模式

### Post-Test Review / 測試後審查
- [ ] Review test results against expected outcomes / 根據預期結果審查測試結果
- [ ] Identify and prioritize bugs / 識別並確定錯誤優先級
- [ ] Document performance metrics / 記錄性能指標
- [ ] Create bug reports for issues found / 為發現的問題創建錯誤報告

---

## 🚀 Automated Testing Recommendations / 自動化測試建議

### Unit Tests / 單元測試
```javascript
// Test compression utility
test('compressImage reduces file size', async () => {
  const largeFile = createMockImage(10MB);
  const compressed = await compressImage(largeFile);
  expect(compressed.fileSize).toBeLessThan(1MB);
});

// Test validation functions
test('validateNameTag rejects empty names', () => {
  const result = validateNameTag('');
  expect(result.isValid).toBe(false);
});
```

### Integration Tests / 集成測試
```javascript
// Test upload flow
test('complete upload flow works', async () => {
  const mockFile = createMockImage();
  await uploadImage(mockFile);
  expect(screen.getByText('Upload successful')).toBeInTheDocument();
});
```

### E2E Tests / 端到端測試
```javascript
// Test user journey
test('user can upload and search items', async () => {
  await page.goto('/');
  await page.click('[data-testid="upload-button"]');
  await page.setInputFiles('[data-testid="file-input"]', 'test.jpg');
  await page.fill('[data-testid="name-input"]', 'Test Item');
  await page.click('[data-testid="submit-button"]');
  await page.fill('[data-testid="search-input"]', 'Test Item');
  await expect(page.locator('[data-testid="item-card"]')).toBeVisible();
});
```

---

## 📊 Success Criteria / 成功標準

### Functional Requirements / 功能要求
- ✅ All features work as specified / 所有功能按規範工作
- ✅ No critical bugs in core functionality / 核心功能無嚴重錯誤
- ✅ Error handling works gracefully / 錯誤處理優雅工作
- ✅ Validation provides helpful feedback / 驗證提供有幫助的反饋

### Performance Requirements / 性能要求
- ✅ Page load time < 3 seconds / 頁面加載時間<3秒
- ✅ Image compression reduces size by 60%+ / 圖片壓縮減少大小60%+
- ✅ Search responds within 500ms / 搜索在500ms內響應
- ✅ Memory usage stable during navigation / 導航期間內存使用穩定

### User Experience Requirements / 用戶體驗要求
- ✅ Intuitive interface for all users / 所有用戶的直觀界面
- ✅ Clear feedback for all actions / 所有可能操作的清晰反饋
- ✅ Responsive design works on all devices / 響應式設計適用於所有設備
- ✅ Accessibility standards met / 符合無障碍標準

---

## 🔄 Regression Testing / 回歸測試

### Critical Path Testing / 關鍵路徑測試
- [ ] Upload flow (compression, validation, save) / 上傳流程（壓縮、驗證、保存）
- [ ] Search and filter functionality / 搜索和過濾功能
- [ ] Admin vs guest mode differences / 管理員與訪客模式差異
- [ ] Data persistence across sessions / 跨會話數據持久性

### Browser Compatibility / 瀏覽器兼容性
- [ ] Chrome (latest) / Chrome（最新版）
- [ ] Safari (latest) / Safari（最新版）
- [ ] Firefox (latest) / Firefox（最新版）
- [ ] Edge (latest) / Edge（最新版）

### Device Testing / 設備測試
- [ ] Desktop (1920x1080) / 桌面（1920x1080）
- [ ] Tablet (768x1024) / 平板（768x1024）
- [ ] Mobile (375x667) / 移動（375x667）

---

## 📝 Bug Reporting Template / 錯誤報告模板

```markdown
## Bug Report / 錯誤報告

### Title / 標題
[Brief description of issue] / [問題簡要描述]

### Steps to Reproduce / 重現步驟
1. Go to... / 前往...
2. Click on... / 點擊...
3. Enter... / 輸入...
4. See error / 看到錯誤

### Expected Behavior / 預期行為
[What should happen] / [應該發生什麼]

### Actual Behavior / 實際行為
[What actually happened] / [實際發生了什麼]

### Environment / 環境
- Browser: [Chrome/Safari/etc] / 瀏覽器：[Chrome/Safari等]
- Device: [Mobile/Desktop/Tablet] / 設備：[移動/桌面/平板]
- User role: [Guest/Admin] / 用戶角色：[訪客/管理員]

### Screenshots / 截圖
[Attach screenshots if applicable] / [如適用，附上截圖]

### Additional Info / 附加信息
[Any other relevant information] / [任何其他相關信息]
```

---

## 🎯 Next Steps / 後續步驟

1. **Execute manual tests** using this checklist / 使用此檢查清單執行手動測試
2. **Implement automated tests** for critical functions / 為關鍵功能實現自動化測試
3. **Performance monitoring** in production environment / 生產環境中的性能監控
4. **User acceptance testing** with real users / 與真實用戶的用戶驗收測試
5. **Continuous testing** as part of development workflow / 作為開發工作流程一部分的持續測試
