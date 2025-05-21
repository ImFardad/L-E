// رسم نمودار هفتگی با Chart.js (global)
const ctx = document.getElementById('chart-canvas').getContext('2d');
const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const data   = [1.5,2,1,0.5,2.5,0,3];

new Chart(ctx, {
  type: 'bar',
  data: {
    labels,
    datasets: [{
      label: 'Hours Studied',
      data,
      backgroundColor: 'rgba(165, 180, 252, 0.5)'
    }]
  },
  options: {
    scales: { y: { beginAtZero: true } }
  }
});
