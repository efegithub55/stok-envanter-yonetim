// /assets/js/charts/inOut.js
document.addEventListener("DOMContentLoaded", function () {
  const el = document.querySelector("#inOutChart");
  if (!el || typeof ApexCharts === "undefined") return;

  const data = (window.REPORT_CHARTS && window.REPORT_CHARTS.inOut) || {};
  const labels = data.labels || [];
  const giris = data.giris || [];
  const cikis = data.cikis || [];

  if (!labels.length || (!giris.length && !cikis.length)) {
    el.innerHTML =
      "<div class='no-data'><img src='/assets/svg/no_data.svg' /></div>";
    return;
  }

  const options = {
    chart: {
      type: "bar",
      height: 260,
      stacked: false,
      toolbar: { show: false },
    },
    series: [
      { name: "Giriş", data: giris },
      { name: "Çıkış", data: cikis },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%",
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: "11px" },
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px" },
      },
      title: {
        text: "Adet",
        style: { fontSize: "11px" },
      },
    },
    grid: {
      borderColor: "rgba(148, 163, 184, 0.25)",
      strokeDashArray: 4,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " adet";
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontSize: "11px",
    },
  };

  const chart = new ApexCharts(el, options);
  chart.render();
});
