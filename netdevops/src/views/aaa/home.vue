<template>
    <div class="aaa-container">
      <img src="../../assets/computer.jpg" alt="Computer" class="computer-image">
    </div>
  </template>
  
  <script setup lang="ts">
  </script>
  
  <style scoped>
  .aaa-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #1a1a1a;
  }
  
  .computer-image {
    max-width: 80%;
    max-height: 80%;
    object-fit: contain;
  }
  </style>