# Реестр дизайнов экранов (design/stitch_create_wallet_step_1)

Ниже представлено соответствие готовых дизайнов экранов и компонентов требованиям [DESIGN_BRIEF.md](../docs/DESIGN_BRIEF.md).

## 1. Процесс создания и входа (Onboarding)
*   **welcome_screen** → *Бриф 5.1*: Стартовый экран с выбором «Create» или «Import».
*   **unlock_screen** → *Бриф 5.4*: Экран разблокировки существующего кошелька паролем.
*   **create_wallet_step_1** → *Бриф 5.2.1*: Установка пароля при создании нового кошелька.
*   **create_wallet_step_2** → *Бриф 5.2.2*: Резервное копирование мнемоники (24 слова).

## 2. Импорт кошелька (Import Flow)
*   **import_wallet_step_1_enter_mnemonic** → *Бриф 5.3.1*: Ввод 24 слов для восстановления.
*   **import_wallet_step_2_select_version** → *Бриф 5.3.2*: Выбор версии смарт-контракта (v4R2, v3R2 и др.).
*   **import_wallet_step_3_set_password** → *Бриф 5.3.3*: Установка пароля для импортированного кошелька.

## 3. Основной интерфейс и управление (Wallet Core)
*   **main_screen** → *Бриф 5.5*: Главный экран с балансом и историей транзакций.
*   **main_screen_empty_state** → *Бриф 5.5*: Вид главного экрана при отсутствии транзакций.
*   **receive_screen** → *Бриф 5.6*: Экран получения средств с QR-кодом.
*   **settings_screen** → *Бриф 5.8*: Настройки кошелька, безопасность и «Danger Zone».

## 4. Процесс отправки (Send Flow)
*   **send_ton_input** → *Бриф 5.7.1*: Форма ввода адреса получателя и суммы.
*   **confirm_transaction** → *Бриф 5.7.2*: Подтверждение транзакции, проверка Warning-карточек и пароля.
*   **send_result_pending** → *Бриф 5.7.3*: Анимация/статус отправки транзакции.
*   **send_result_success** → *Бриф 5.7.3*: Успешное завершение отправки.
*   **send_result_error** → *Бриф 5.7.3*: Сообщение об ошибке отправки.
*   **send_result_timeout** → *Бриф 5.7.3*: Статус транзакции неизвестен (таймаут).

## 5. Безопасность и дополнительные компоненты
*   **export_recovery_step_1_verify_password** → *Бриф 5.8 (Export)*: Проверка пароля перед показом фразы.
*   **export_recovery_step_2_show_phrase** → *Бриф 5.8 (Export)*: Отображение фразы восстановления в модальном окне.
*   **change_password_modal** → *Бриф 5.8 (Change Password)*: Модальное окно смены пароля.
*   **delete_wallet_modal** → *Бриф 5.8 (Delete Wallet)*: Модальное окно удаления кошелька (ввод "DELETE").
*   **component_sheet_ui_kit** → *Бриф 4*: Общий лист всех UI-компонентов (кнопки, инпуты, карточки).
*   **nodal_slate** → *Бриф 2 & 3*: Основная дизайн-концепция («The Precise Architect») и правила работы с цветами/отступами.

---

### Сводная таблица

| Папка (Экран/Компонент) | Соответствие DESIGN_BRIEF.md | Статус |
| :--- | :--- | :--- |
| **welcome_screen** | 5.1 Welcome Screen | Готово |
| **unlock_screen** | 5.4 Unlock Screen | Готово |
| **create_wallet_step_1** | 5.2.1 Step 1: Set Password | Готово |
| **create_wallet_step_2** | 5.2.2 Step 2: Backup Mnemonic | Готово |
| **import_wallet_step_1_enter_mnemonic** | 5.3.1 Step 1: Enter Mnemonic | Готово |
| **import_wallet_step_2_select_version** | 5.3.2 Step 2: Select Version | Готово |
| **import_wallet_step_3_set_password** | 5.3.3 Step 3: Set Password | Готово |
| **main_screen** | 5.5 Main Screen | Готово |
| **main_screen_empty_state** | 5.5 (Пустое состояние) | Готово |
| **receive_screen** | 5.6 Receive Screen | Готово |
| **send_ton_input** | 5.7.1 Step 1: Input Form | Готово |
| **confirm_transaction** | 5.7.2 Step 2: Confirmation | Готово |
| **send_result_pending** | 5.7.3 Step 3: Result (Pending) | Готово |
| **send_result_success** | 5.7.3 Step 3: Result (Success) | Готово |
| **send_result_error** | 5.7.3 Step 3: Result (Error) | Готово |
| **send_result_timeout** | 5.7.3 Step 3: Result (Timeout) | Готово |
| **settings_screen** | 5.8 Settings Screen | Готово |
| **export_recovery_step_1_verify_password** | 5.8 Sub-flow: Export (Step 1) | Готово |
| **export_recovery_step_2_show_phrase** | 5.8 Sub-flow: Export (Step 2) | Готово |
| **change_password_modal** | 5.8 Sub-flow: Change Password | Готово |
| **delete_wallet_modal** | 5.8 Sub-flow: Delete Wallet | Готово |
| **component_sheet_ui_kit** | 4. UI-компоненты / 10. (Item 2) | Готово |
| **nodal_slate** | 2. Общие требования / 3. Дизайн-система | Готово |
