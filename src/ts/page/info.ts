import "../../css/page/info.css";

import { log } from "../function/log";
import * as auth from "../module/auth";
import { setupAddressManage } from "../module/info/address-manage";
import { setupChangePassword } from "../module/info/password";
import { setupContactModal } from "../module/info/contact";
import { setupFindPassword, setupFindUsername } from "../module/info/recovery";
import { populateInfoPage, setupProfileUploader } from "../module/info/profile";
import { hideSignup, setupSignup, showSignup } from "../module/info/signup";

export function initInfo() {
  log("info");
  setupInfoLogin();
  setupChangePassword();
  setupContactModal();
  setupAddressManage();
}

function setupInfoLogin() {
  const loginSection = document.querySelector<HTMLElement>(".info-login");
  const signupSection = document.querySelector<HTMLElement>(".info-signup");
  const infoPage = document.querySelector<HTMLElement>(".info-page");

  const form = document.querySelector("#info-login-form") as HTMLFormElement | null;

  if (!loginSection || !infoPage || !form) return;

  const feedback = form.querySelector<HTMLElement>(".info-login__feedback");

  const submitButton = form.querySelector<HTMLButtonElement>(".info-login__submit");
  const signupTrigger = document.querySelector<HTMLButtonElement>(".js-info-open-signup");

  const signupBackButton = signupSection?.querySelector<HTMLButtonElement>('[data-action="back"]');

  if (signupTrigger && signupSection) {
    signupTrigger.addEventListener("click", () => showSignup(loginSection, signupSection));
  }
  if (signupBackButton && signupSection) {
    signupBackButton.addEventListener("click", () => hideSignup(loginSection, signupSection));
  }

  setupFindUsername();
  setupFindPassword();

  const sessionAuthed = sessionStorage.getItem(auth.LOGIN_STORAGE_KEY) === "true";
  const authedUsernameSession = sessionStorage.getItem(auth.LOGIN_USER_KEY);

  const authedUsername = authedUsernameSession;

  if (sessionAuthed && authedUsername) {
    console.log("로그인 되어있는중");
    const authedUser = auth.findUserByUsername(authedUsernameSession);

    if (authedUser) {
      populateInfoPage(authedUser);
      setupProfileUploader();
      setupChangePassword();
      setupContactModal();
      setupAddressManage();
      revealInfoPage(loginSection, infoPage, signupSection ?? undefined);

      const logoutBtnRestored = document.getElementById("js-info-logout") as HTMLButtonElement | null;
      logoutBtnRestored?.addEventListener("click", () => {
        sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
        sessionStorage.removeItem(auth.LOGIN_USER_KEY);
        localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
        localStorage.removeItem(auth.LOGIN_USER_KEY);

        if (feedback) {
          feedback.textContent = "로그아웃 버튼으로 로그아웃 성공";
          feedback.classList.remove("is-success");
        }
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "로그인";
        }

        loginSection.classList.remove("d-none");
        infoPage.classList.add("d-none");
      });
      return;
    }
    sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
    sessionStorage.removeItem(auth.LOGIN_USER_KEY);
  } else {
    localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
    localStorage.removeItem(auth.LOGIN_USER_KEY);
  }

  setupSignup(signupSection, loginSection);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const usernameInput = form.querySelector<HTMLInputElement>(".js-login-username") as HTMLInputElement | null;
    const passwordInput = form.querySelector<HTMLInputElement>(".js-login-password") as HTMLInputElement | null;

    if (!usernameInput || !passwordInput || !feedback) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showFeedback(feedback, "아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    const matchedUser = auth.findUserByUsername(username);
    if (!matchedUser || matchedUser.password !== password) {
      showFeedback(feedback, "계정 정보가 일치하지 않습니다. 다시 확인해주세요.");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "로그인 중...";
    }

    showFeedback(feedback, "로그인에 성공했어요!", true);

    sessionStorage.setItem(auth.LOGIN_STORAGE_KEY, "true");
    sessionStorage.setItem(auth.LOGIN_USER_KEY, matchedUser.username);

    localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
    localStorage.removeItem(auth.LOGIN_USER_KEY);
    populateInfoPage(matchedUser);
    setupProfileUploader();
    setupChangePassword();
    setupContactModal();
    setupAddressManage();
    form.reset();
    revealInfoPage(loginSection, infoPage, signupSection ?? undefined);

    const logoutBtn = document.getElementById("js-info-logout") as HTMLButtonElement | null;
    logoutBtn?.addEventListener("click", () => {
      sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
      sessionStorage.removeItem(auth.LOGIN_USER_KEY);
      localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
      localStorage.removeItem(auth.LOGIN_USER_KEY);

      if (feedback) {
        feedback.textContent = "로그아웃 성공";
        feedback.classList.remove("is-success");
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "로그인";
      }

      loginSection.classList.remove("d-none");
      infoPage.classList.add("d-none");
    });
  });
}

function revealInfoPage(loginSection: HTMLElement, infoPage: HTMLElement, signupSection?: HTMLElement) {
  loginSection.classList.add("d-none");
  if (signupSection) signupSection.classList.add("d-none");
  infoPage.classList.remove("d-none");
}

function showFeedback(target: HTMLElement, message: string, success = false) {
  target.textContent = message;
  target.classList.toggle("is-success", success);
}
