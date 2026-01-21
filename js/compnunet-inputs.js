// /*================================================================ */
// //------------------------- Custom Date Picker
// /*================================================================*/

function renderDateicker(){
    const daysContainer = document.getElementById("daysContainer");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const monthYear = document.getElementById("monthYear");
    const dateInput = document.getElementById("dateInput");
    const calendar = document.getElementById("calendar");

    let currentDate = new Date();
    let selectedDate = null;

    function handleDayClick(day) {
    selectedDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
    );

    const options = {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        weekday: 'long'
    };
    dateInput.value= new Intl.DateTimeFormat('en-US', options).format(selectedDate);
    //   dateInput.value = selectedDate.toLocaleDateString("en-US");
    calendar.style.display = "none";
    renderCalendar();
    }

    function createDayElement(day) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayElement = document.createElement("div");
    dayElement.classList.add("day");

    if (date.toDateString() === new Date().toDateString()) {
        dayElement.classList.add("current");
    }
    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        dayElement.classList.add("selected");
    }

    dayElement.textContent = day;
    dayElement.addEventListener("click", () => {
        handleDayClick(day);
    });
    daysContainer.appendChild(dayElement);
    }

    function renderCalendar() {
    daysContainer.innerHTML = "";
    const firstDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
    );
    const lastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
    );

    monthYear.textContent = `${currentDate.toLocaleString("default", {
        month: "long"
    })} ${currentDate.getFullYear()}`;

    for (let day = 1; day <= lastDay.getDate(); day++) {
        createDayElement(day);
    }
    }

    prevBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    });

    nextBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    });

    dateInput.addEventListener("click", () => {
    calendar.style.display = "block";
    positionCalendar();
    });

    document.addEventListener("click", (event) => {
    if (!dateInput.contains(event.target) && !calendar.contains(event.target)) {
        calendar.style.display = "none";
    }
    });

    function positionCalendar() {
    const inputRect = dateInput.getBoundingClientRect();
    //   calendar.style.top = inputRect.bottom + "px";
    //   calendar.style.left = inputRect.left + "px";
    }
    window.addEventListener("resize", positionCalendar);

    renderCalendar();
}


// /*================================================================ */
// //------------------------- Custom Drop Down List
// /*================================================================*/

function setupCustomDropdown(parentElement) {
    let wrapper = parentElement;
    let selectedDiv = wrapper.querySelector('.li-selected');
    let dropdown = wrapper.querySelector('.dropdown-list');
    let searchInput = dropdown.querySelector('.dropdown-menu-search');
    let ul = wrapper.querySelector('.ul-dropdown-inner');
    let lis = ul.querySelectorAll('li');

    // Toggle dropdown open/close when clicking the selected div
    selectedDiv.addEventListener('click', () => {
        dropdown.classList.toggle('open'); 
        if (dropdown.classList.contains('open')) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            filterOptions(''); 
        }
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('open');
            searchInput.value = '';
            filterOptions('');
        }
    });

    // Search/filter functionality
    searchInput.addEventListener('input', (e) => {
        filterOptions(e.target.value.toLowerCase());
    });

    function filterOptions(searchTerm) {
        lis.forEach((li) => {
            const text = li.textContent.toLowerCase();
            li.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    }

    // Select an option when clicking an <li>
    ul.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        console.log(li)
        if (li) {
            const dataValue = li.dataset.value;
            const value = li.value;
            const text = li.textContent;
            lis.forEach((ele)=>{
                ele.classList.remove("li-is-select")
            })
            li.classList.add("li-is-select")
            selectedDiv.dataset.value = dataValue;
            selectedDiv.textContent = text;
            selectedDiv.setAttribute('value',value)

            dropdown.classList.remove('open'); // Close dropdown
            searchInput.value = '';
            filterOptions(''); // Reset filter
        }
    });
    // selectedDiv.textContent = 'Selected Value'; 
    // selectedDiv.dataset.value = '';
    // dropdown.classList.remove('open');
}