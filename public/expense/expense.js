const expenseForm = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");
const premiumStatus = document.getElementById("premiumStatus");
const leaderboardList = document.getElementById("leaderboardList");
const historyList = document.getElementById('historyList');
const pagination = document.getElementById("pagination");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
let currentPage = 1;
let totalPages = 1;
let itemsPerPageSelect = document.getElementById('itemsPerPage');

let itemsPerPage = parseInt(localStorage.getItem('itemsPerPage')) || 10;

itemsPerPageSelect.value = itemsPerPage;

itemsPerPageSelect.addEventListener('change', function() {
    itemsPerPage = parseInt(this.value);
    localStorage.setItem('itemsPerPage', itemsPerPage);
    fetchExpenses(1); 
});

function fetchExpenses(page = 1) {
    const token = localStorage.getItem('token');
    axios.get(`http://16.171.140.226:3000/expense?page=${page}&limit=${itemsPerPage}`, { headers: { 'authorization': token } })
        .then((res) => {
            const { expenses, totalPages: total, currentPage: current } = res.data || {};
            expenseList.innerHTML = '';
            totalPages = total;
            currentPage = current;

            expenses.forEach((expense) => {
                appendExpenseToList(expense);
            });

            updatePagination();
        })
        .catch(err => {
            console.error('Error fetching expenses:', err);
        });
}

function updatePagination() {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;
}

prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        fetchExpenses(currentPage - 1);
    }
});

nextPageButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
        fetchExpenses(currentPage + 1);
    }
});

function appendExpenseToList(expense) {
    const listItem = document.createElement('li');
    listItem.textContent = `${expense.amount} - ${expense.description} - ${expense.category}  `;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Expense';
    deleteButton.onclick = () => {
        deleteExpense(expense.id);
    };

    listItem.appendChild(deleteButton);
    expenseList.appendChild(listItem);
}

expenseForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    const formData = new FormData(expenseForm);
    const amount = formData.get('expenseAmount');
    const description = formData.get('description');
    const category = formData.get('category');

    axios.post('http://16.171.140.226:3000/expense', { amount, description, category }, { headers: { 'authorization': token } })
        .then((res) => {
            fetchExpenses(currentPage);
            expenseForm.reset();
        })
        .catch(err => {
            console.error('Error adding expense:', err);
        });
});

function deleteExpense(expenseId) {
    const token = localStorage.getItem('token');
    axios.delete(`http://16.171.140.226:3000/expense/${expenseId}`, { headers: { 'authorization': token } })
        .then((res) => {
            fetchExpenses(currentPage);
        })
        .catch(err => {
            if (err.response && err.response.status === 404) {
                alert('Expense not found or already deleted.'); 
            } else {
                console.error('Error deleting expense:', err);
            }
        });
}

const premiumButton = document.getElementById("rzp-button");
premiumButton.addEventListener("click", function (event) {
  const token = localStorage.getItem("token");
//   console.log(token); 
  axios
    .get("http://16.171.140.226:3000/purchase/premiumMembership", {
      headers: { Authorization: token },
    })
    .then((response) => {
      var options = {
        key: response.data.key_id,
        order_id: response.data.order.id,
        handler: function (response) {
          axios
            .post(
              "http://16.171.140.226:3000/purchase/updateTransactionStatus",
                {
                    order_id: options.order_id,
                    payment_id: response.razorpay_payment_id,
                },
                { headers: { Authorization: token } }
            )
            .then((response) => {
                alert("You are a premium user now");
                checkPremiumStatus();
                // premiumStatus.innerHTML = "You are a Premium User";
                // localStorage.setItem("token", response.data.token);
            })
            .catch((err) => {
              console.log(err);
            });
        },
      };
      const razorpayInstance = new Razorpay(options);
      razorpayInstance.open();
      razorpayInstance.on("payment.failed", function () {
        alert("Something went wrong");
        // premiumStatus.innerHTML = "";
      });
    })
    .catch((err) => {
      console.log(err);
    });

  event.preventDefault();
});

function checkPremiumStatus() {
    const token = localStorage.getItem('token');
    axios.get('http://16.171.140.226:3000/user/premiumStatus', { headers: { 'authorization': token } })
        .then((res) => {
            if (res.data.status === 'SUCCESS') {
                premiumStatus.innerHTML = "You are a Premium User  ";
                premiumButton.remove();
                const leaderboardButton = document.createElement('button');
                leaderboardButton.textContent = 'Show Leaderboard';
                leaderboardButton.onclick = () => {
                    leaderboardList.innerHTML = '';
                    showLeaderboard();
                }
                premiumStatus.appendChild(leaderboardButton);

                const downloadReportButton = document.createElement('button');
                downloadReportButton.textContent = 'Download Report';
                downloadReportButton.onclick = () => {
                    download();
                }
                premiumStatus.appendChild(downloadReportButton);

            } else {
                premiumStatus.innerHTML = "";
            }
        })
        .catch(err => {
            console.error('Error checking premium status:', err);
        });
};

function download() {
    const token = localStorage.getItem('token');
    axios.get('http://16.171.140.226:3000/user/download', { headers: { 'authorization': token } })
        .then((res) => {
            if (res.status === 200) {
                var a = document.createElement('a');
                a.href = res.data.fileUrl;
                a.download = 'myexpense.txt';
                a.click();
            } else {
                throw new Error(res.data.message);
            }
        })
        .catch(err => console.error('Error downloading report:', err));
}

function showLeaderboard(){  
    const token = localStorage.getItem('token');
    axios.get('http://16.171.140.226:3000/premium/leaderboard', { headers: { 'authorization': token } })
        .then((res) => {
            const leaderboard = res.data;
            leaderboardList.innerHTML = '<h1>Leader Board</h1>';

            leaderboard.forEach((user) => {
                const listItem = document.createElement('li');
                listItem.textContent = `NAME - ${user.name} TOTAL EXPENSES - ${user.total} `;
                leaderboardList.appendChild(listItem);
            });
        })
        .catch(err => {
            console.error('Error fetching leaderboard:', err);
        }); 
}

function fetchDownloadHistory() {
    const token = localStorage.getItem('token');
    axios.get('http://16.171.140.226:3000/download/history', { headers: { 'authorization': token } })
        .then((res) => {
            const downloadHistory = res.data;
            const historyList = document.getElementById('historyList');
            historyList.innerHTML = '<h1>Download History</h2>';

            downloadHistory.forEach((history) => {
                const listItem = document.createElement('li');
                const downloadLink = document.createElement('a');
                downloadLink.href = history.fileUrl;
                downloadLink.textContent = `Download (${new Date(history.downloadDate).toLocaleString()})`;
                downloadLink.download = true;

                listItem.appendChild(downloadLink);
                historyList.appendChild(listItem);
            });
        })
        .catch(err => {
            console.error('Error fetching download history:', err);
        });
}

window.onload = function() {
    fetchExpenses(1);
    checkPremiumStatus();
    fetchDownloadHistory();
};
