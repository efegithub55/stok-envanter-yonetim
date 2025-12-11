// /assets/js/charts/mostSeller.js
document.addEventListener("DOMContentLoaded", function () {
  const el = document.querySelector("#mostSellerChart");
  if (!el || typeof ApexCharts === "undefined") return;

  const data = (window.REPORT_CHARTS && window.REPORT_CHARTS.bestSellers) || {};
  const labels = data.labels || [];
  const values = data.values || [];

  if (!labels.length || !values.length) {
    el.innerHTML =
      "<div class='no-data'><img src='/assets/svg/no_data.svg' /></div>";
    return;
  }

  const options = {
    chart: {
      type: "bar",
      height: 260,
      toolbar: { show: false },
    },
    series: [
      {
        name: "Satış Adedi",
        data: values,
      },
    ],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "60%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: true,
      style: { fontSize: "11px" },
      formatter: function (val) {
        return val + " adet";
      },
    },
    xaxis: {
      categories: labels,
      labels: { style: { fontSize: "11px" } },
    },
    yaxis: {
      labels: { style: { fontSize: "11px" } },
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
  };

  const chart = new ApexCharts(el, options);
  chart.render();
});
