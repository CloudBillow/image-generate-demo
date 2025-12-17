import { ref, computed } from 'vue'

// 原始菜单数据（扩展元信息）
const rawMenuData = [
  {
    path: '/app/volcengine-seedream4-image',
    name: 'volcengine-seedream4-image',
    platform: 'volcengine',
    platformLabel: '火山引擎',
    model: 'Seedream4',
    type: 'image',
    typeLabel: '图片生成',
    icon: 'Picture'
  },
  {
    path: '/app/yi-bananapro-image',
    name: 'yi-bananapro-image',
    platform: 'yi',
    platformLabel: 'API易',
    model: 'BananaPro',
    type: 'image',
    typeLabel: '图片生成',
    icon: 'Picture'
  },
  {
    path: '/app/plato-bananapro-image',
    name: 'plato-bananapro-image',
    platform: 'plato',
    platformLabel: '柏拉图',
    model: 'BananaPro',
    type: 'image',
    typeLabel: '图片生成',
    icon: 'Picture'
  },
  {
    path: '/app/yi-sora2-video',
    name: 'yi-sora2-video',
    platform: 'yi',
    platformLabel: 'API易',
    model: 'Sora2',
    type: 'video',
    typeLabel: '视频生成',
    icon: 'VideoCamera'
  },
  {
    path: '/app/plato-sora2-video',
    name: 'plato-sora2-video',
    platform: 'plato',
    platformLabel: '柏拉图',
    model: 'Sora2',
    type: 'video',
    typeLabel: '视频生成',
    icon: 'VideoCamera'
  },
  {
    path: '/app/tongyi-wanxiang-video',
    name: 'tongyi-wanxiang-video',
    platform: 'tongyi',
    platformLabel: '通义万相',
    model: 'Wanxiang2.5',
    type: 'video',
    typeLabel: '视频生成',
    icon: 'VideoCamera'
  },
  {
    path: '/app/volcengine-seedance-pro-video',
    name: 'volcengine-seedance-pro-video',
    platform: 'volcengine',
    platformLabel: '火山引擎',
    model: 'Seedance1.0Pro',
    type: 'video',
    typeLabel: '视频生成',
    icon: 'VideoCamera'
  },
  {
    path: '/app/image-editor',
    name: 'image-editor',
    platform: 'toolkit',
    platformLabel: '工具箱',
    model: '图片编辑',
    type: 'editor',
    typeLabel: '图片编辑',
    icon: 'Edit'
  }
]

// 平台图标映射
function getPlatformIcon(platform) {
  const iconMap = {
    volcengine: 'carbon:cloud-services',
    yi: 'carbon:api',
    plato: 'mdi:chip',
    tongyi: 'carbon:ai-governance-tracked',
    toolkit: 'carbon:tool-kit'
  }
  return iconMap[platform] || 'carbon:application'
}

// 类型图标映射
function getTypeIcon(type) {
  const iconMap = {
    image: 'carbon:image',
    video: 'carbon:video',
    editor: 'carbon:crop'
  }
  return iconMap[type] || 'carbon:application'
}

export function useMenuGrouping() {
  // 分组模式状态（localStorage持久化，默认为 type）
  const groupMode = ref(localStorage.getItem('menuGroupMode') || 'type')

  // 分组展开状态（localStorage持久化）
  const expandedGroups = ref(
    JSON.parse(localStorage.getItem('menuExpandedGroups') || '{}')
  )

  // 计算按平台分组的菜单
  const platformGroupedMenu = computed(() => {
    const groups = {}
    rawMenuData.forEach(item => {
      if (!groups[item.platform]) {
        groups[item.platform] = {
          groupKey: item.platform,
          groupLabel: item.platformLabel,
          groupIcon: getPlatformIcon(item.platform),
          children: []
        }
      }
      groups[item.platform].children.push({
        path: item.path,
        name: item.name,
        modelLabel: item.model,
        icon: item.icon,
        // 按平台分组时，显示类型标签
        tagType: 'type',
        tagValue: item.type,
        tagLabel: item.type === 'image' ? '图像' : '视频'
      })
    })
    return Object.values(groups)
  })

  // 计算按类型分组的菜单
  const typeGroupedMenu = computed(() => {
    const groups = {}
    rawMenuData.forEach(item => {
      if (!groups[item.type]) {
        groups[item.type] = {
          groupKey: item.type,
          groupLabel: item.typeLabel,
          groupIcon: getTypeIcon(item.type),
          children: []
        }
      }
      groups[item.type].children.push({
        path: item.path,
        name: item.name,
        modelLabel: item.model,
        icon: item.icon,
        // 按类型分组时，显示平台标签
        tagType: 'platform',
        tagValue: item.platform,
        tagLabel: item.platformLabel
      })
    })
    return Object.values(groups)
  })

  // 根据当前模式返回对应的菜单
  const currentMenu = computed(() => {
    return groupMode.value === 'platform'
      ? platformGroupedMenu.value
      : typeGroupedMenu.value
  })

  // 切换分组模式
  const setGroupMode = (mode) => {
    groupMode.value = mode
    localStorage.setItem('menuGroupMode', mode)
  }

  // 切换分组展开状态
  const toggleGroup = (groupKey) => {
    expandedGroups.value[groupKey] = !expandedGroups.value[groupKey]
    localStorage.setItem('menuExpandedGroups', JSON.stringify(expandedGroups.value))
  }

  // 检查分组是否展开（默认展开）
  const isGroupExpanded = (groupKey) => {
    return expandedGroups.value[groupKey] !== false
  }

  // 根据当前路由自动展开对应分组
  const expandGroupByRoute = (routeName) => {
    const item = rawMenuData.find(i => i.name === routeName)
    if (item) {
      const groupKey = groupMode.value === 'platform' ? item.platform : item.type
      expandedGroups.value[groupKey] = true
      localStorage.setItem('menuExpandedGroups', JSON.stringify(expandedGroups.value))
    }
  }

  return {
    groupMode,
    currentMenu,
    setGroupMode,
    toggleGroup,
    isGroupExpanded,
    expandGroupByRoute
  }
}
