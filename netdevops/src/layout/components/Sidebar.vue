const menuItems = [
  {
    title: '首页',
    icon: 'House',
    path: '/index'
  },
  {
    title: '资产管理',
    icon: 'Box',
    children: [
      {
        title: '网络设备管理',
        path: '/index/asset/network'
      },
      {
        title: '服务器管理',
        path: '/index/asset/server'
      },
      {
        title: '平台管理',
        path: '/index/asset/platform'
      },
      {
        title: '专线管理',
        path: '/index/asset/line'
      }
    ]
  },
  {
    title: '基础服务管理',
    icon: 'Service',
    children: [
      {
        title: '日志管理',
        children: [
          {
            title: 'AAA日志',
            path: '/index/service/log/aaa'
          },
          {
            title: 'NTP日志',
            path: '/index/service/log/ntp'
          }
        ]
      },
      {
        title: '状态管理',
        children: [
          {
            title: 'AAA状态',
            path: '/index/service/status/aaa'
          },
          {
            title: 'NTP状态',
            path: '/index/service/status/ntp'
          }
        ]
      }
    ]
  },
  {
    title: '用户管理',
    icon: 'User',
    children: [
      {
        title: '登录管理',
        path: '/index/user'
      },
      {
        title: '权限管理',
        path: '/index/user/permission'
      }
    ]
  },
  {
    title: '变更中心',
    icon: 'Operation',
    children: [
      {
        title: '自动化配置',
        path: '/index/change/automation'
      },
      {
        title: '巡检',
        path: '/index/change/inspection'
      },
      {
        title: '标准化配置模板',
        path: '/index/change/template'
      }
    ]
  }
] 
