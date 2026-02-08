/*==================================================================================*/
/*============================= Date Picker Comp ===================================*/
/*==================================================================================*/
document.addEventListener("DOMContentLoaded", ()=>{
    let datePickerContiners = document.querySelectorAll(".datePickerContiner");
    datePickerContiners.forEach((ele) => {
    if (ele) {
        intializeDatePicker();
    }
    });
});
function intializeDatePicker() {
    const monthSelect = document.getElementById("month-select");
    const yearSelect = document.getElementById("year-select");
    const daysTag = document.querySelector(".days");
    const prevNextIcons = document.querySelectorAll(".icons span");
  let date = new Date(),
    currentYear = date.getFullYear(),
    currentMonth = date.getMonth();
  let selectedDateObj = null;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  for (let i = 0; i < months.length; i++) {
    let option = document.createElement("div");
    option.classList += " calendar-select-list";
    option.id = `option-${i}`;
    option.value = i;
    if (currentMonth === i) {
      option.classList += " month active";
    }
    option.addEventListener("click", function () {
      toggleDropdownMonth(i, months[i]);
    });
    option.textContent = months[i];
    monthSelect.appendChild(option);
  }

  for (let i = currentYear - 50; i <= currentYear + 50; i++) {
    let option = document.createElement("div");
    option.classList += " calendar-select-list";
    option.value = i;
    option.id = `option-${i}`;
    if (currentYear === i) {
      option.classList += " year active";
    }
    option.textContent = i;
    option.addEventListener("click", function () {
      toggleDropdownYear(i);
    });
    yearSelect.appendChild(option);
  }
  const backdrop = document.getElementById("calendar-backdrop");
  const calendarWrapper = document.getElementById("calendar-wrapper");
  backdrop.addEventListener("click", (e) => {
    e.stopPropagation();
    calendarWrapper.classList.add("show-calender");
  });

  document.addEventListener("click", (e) => {
    if (!calendarWrapper.contains(e.target) && !backdrop.contains(e.target)) {
      calendarWrapper.classList.remove("show-calender");
      monthSelect.classList.remove("show-dropdown");
      yearSelect.classList.remove("show-dropdown");
    }
  });

  monthSelect.value = currentMonth;
  yearSelect.value = currentYear;
  const toggleCalender = () => {
    const div = document.getElementById("calendar-wrapper");
    div.classList.toggle("show-calender");
  };
  const toggleDropdownMonth = (index, month) => {
    const div = document.getElementById("month-select");
    const year_div = document.getElementById("year-select");
    year_div.classList.remove("show-dropdown");
    if (month) {
      currentMonth = index;
      document
        .querySelectorAll(".calendar-select-list.month.active")
        .forEach((el) => {
          el.classList.remove("active");
        });
      const div_option = document.getElementById(`option-${index}`);
      div_option.classList += " month active";
      renderCalendar();
    }
    div.classList.toggle("show-dropdown");
  };

  const toggleDropdownYear = (year) => {
    const div = document.getElementById("year-select");
    const month_div = document.getElementById("month-select");
    month_div.classList.remove("show-dropdown");
    if (year) {
      currentYear = year;
      document
        .querySelectorAll(".calendar-select-list.year.active")
        .forEach((el) => {
          el.classList.remove("active");
        });
      const div_option = document.getElementById(`option-${year}`);
      div_option.classList += " year active";
      renderCalendar();
    }
    div.classList.toggle("show-dropdown");
  };
  const renderCalendar = () => {
    let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    let lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let lastDayOfMonth = new Date(
      currentYear,
      currentMonth,
      lastDateOfMonth,
    ).getDay();
    const dropdown_month = document.getElementById("selected-month");
    dropdown_month.innerText = months[currentMonth];
    const dropdown_year = document.getElementById("selected-year");
    dropdown_year.innerText = currentYear;
    let lastDateOfLastMonth = new Date(currentYear, currentMonth, 0).getDate();
    let liDayTag = "";

    for (let i = firstDayOfMonth; i > 0; i--) {
      liDayTag += `<li class="inactive">${lastDateOfLastMonth - i + 1}</li>`;
    }

    for (let i = 1; i <= lastDateOfMonth; i++) {
      let isToday = "";
      if (selectedDateObj) {
        if (
          i === selectedDateObj.getDate() &&
          currentMonth === selectedDateObj.getMonth() &&
          currentYear === selectedDateObj.getFullYear()
        ) {
          isToday = 'class="active"';
        }
      } else {
        if (
          i === date.getDate() &&
          currentMonth === new Date().getMonth() &&
          currentYear === new Date().getFullYear()
        ) {
          isToday = 'class="active"';
        }
      }
      liDayTag += `<li ${isToday} onclick="selectDate(${i})">${i}</li>`;
    }

    for (let i = lastDayOfMonth; i < 6; i++) {
      liDayTag += `<li class="inactive">${i - lastDayOfMonth + 1}</li>`;
    }

    daysTag.innerHTML = liDayTag;
  };

  const selectDate = (day) => {
    const selectedDateText = document.querySelector(".selected-date-text");
    // Format: DD/MM/YYYY
    const formattedDate = `${day}/${currentMonth + 1}/${currentYear}`;
    selectedDateText.innerText = formattedDate;

    selectedDateObj = new Date(currentYear, currentMonth, day);
    renderCalendar();

    // Close calendar
    const calendarWrapper = document.getElementById("calendar-wrapper");
    calendarWrapper.classList.remove("show-calender");

    // Close dropdowns if open (just in case)
    monthSelect.classList.remove("show-dropdown");
    yearSelect.classList.remove("show-dropdown");
  };

  renderCalendar(currentMonth, currentYear);

  monthSelect.addEventListener("change", (e) => {
    currentMonth = parseInt(e.target.value);
    renderCalendar();
  });

  yearSelect.addEventListener("change", (e) => {
    currentYear = parseInt(e.target.value);
    renderCalendar();
  });
  prevNextIcons.forEach((icon) => {
    icon.addEventListener("click", () => {
      currentMonth =
        icon.id === "prevIcon" ? currentMonth - 1 : currentMonth + 1;

      if (currentMonth < 0 || currentMonth > 11) {
        date = new Date(currentYear, currentMonth);
        currentYear = date.getFullYear();
        currentMonth = date.getMonth();
        return;
      } else {
        date = new Date();
      }

      renderCalendar();
    });
  });
}
